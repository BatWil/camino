import type { JournalKind, Tables } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { enqueue, isOutboxSupported, pending, remove } from "@/lib/offline/secure-outbox";
import { AppError } from "@/types/result";

export type JournalEntry = Tables<"journal_entries"> & { pendingSync?: boolean };

export interface JournalDraft {
  id: string;
  kind: JournalKind;
  body: string;
  verse_ref: string | null;
  verse_text: string | null;
  devotional_id: string | null;
  entry_date: string;
}

const OUTBOX_KIND = "journal";

/** Pending (offline) entries first, then synced ones; no duplicates by id. */
export function mergeEntries(queued: JournalEntry[], synced: JournalEntry[]): JournalEntry[] {
  const ids = new Set(synced.map((e) => e.id));
  return [...queued.filter((q) => !ids.has(q.id)), ...synced];
}

function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const message = String((error as { message?: string })?.message ?? error);
  return /fetch|network|Failed to fetch|Load failed/i.test(message);
}

/**
 * Private journal. RLS: only the owner can read or write. Without connection,
 * new entries go to the encrypted outbox and sync later (idempotent by id).
 */
export const journalRepository = {
  /** Entries written offline that are still waiting to sync (decrypted, only for their owner). */
  async queued(userId: string, kind: JournalKind | "all"): Promise<JournalEntry[]> {
    const waiting = await pending<JournalDraft>(OUTBOX_KIND, userId).catch(() => []);
    return waiting
      .map((r) => ({
        ...r.payload,
        user_id: userId,
        created_at: new Date(r.createdAt).toISOString(),
        updated_at: new Date(r.createdAt).toISOString(),
        pendingSync: true,
      }))
      .filter((e) => kind === "all" || e.kind === kind);
  },

  async list(userId: string, kind: JournalKind | "all"): Promise<JournalEntry[]> {
    // Device reports no connection: don't wait for network retries.
    if (typeof navigator !== "undefined" && navigator.onLine === false) throw new AppError("offline", "Sin conexión.");
    let q = requireSupabase()
      .from("journal_entries")
      .select("*")
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);
    if (kind !== "all") q = q.eq("kind", kind);
    const [{ data, error }, queued] = await Promise.all([q, journalRepository.queued(userId, kind)]);
    if (error) {
      if (isNetworkError(error)) throw new AppError("offline", "Sin conexión.", error);
      throw new AppError("unknown", "No pudimos abrir tu diario.", error);
    }
    return mergeEntries(queued, data);
  },

  async get(id: string): Promise<JournalEntry | null> {
    const { data, error } = await requireSupabase().from("journal_entries").select("*").eq("id", id).maybeSingle();
    if (error) throw new AppError("unknown", "No pudimos abrir la entrada.", error);
    return data;
  },

  /** Returns "saved" or "queued" (offline). */
  async create(userId: string, draft: JournalDraft): Promise<"saved" | "queued"> {
    if (typeof navigator !== "undefined" && navigator.onLine === false && isOutboxSupported()) {
      await enqueue({ id: draft.id, kind: OUTBOX_KIND, userId, createdAt: Date.now(), payload: draft });
      return "queued";
    }
    const { error } = await requireSupabase()
      .from("journal_entries")
      .upsert(draft, { onConflict: "id", ignoreDuplicates: true });
    if (!error) return "saved";
    if (isNetworkError(error) && isOutboxSupported()) {
      await enqueue({ id: draft.id, kind: OUTBOX_KIND, userId, createdAt: Date.now(), payload: draft });
      return "queued";
    }
    throw new AppError("unknown", "No pudimos guardar tu entrada.", error);
  },

  async update(id: string, patch: Pick<JournalDraft, "kind" | "body" | "verse_ref" | "verse_text" | "entry_date">) {
    const { error } = await requireSupabase().from("journal_entries").update(patch).eq("id", id);
    if (error) throw new AppError("unknown", "No pudimos guardar los cambios.", error);
  },

  async remove(id: string) {
    const { error } = await requireSupabase().from("journal_entries").delete().eq("id", id);
    if (error) throw new AppError("unknown", "No pudimos borrar la entrada.", error);
  },

  /** Sends queued entries; safe to call repeatedly. Returns how many synced. */
  async flush(userId: string): Promise<number> {
    if (!isOutboxSupported()) return 0;
    const waiting = await pending<JournalDraft>(OUTBOX_KIND, userId);
    let synced = 0;
    for (const record of waiting) {
      const { error } = await requireSupabase()
        .from("journal_entries")
        .upsert(record.payload, { onConflict: "id", ignoreDuplicates: true });
      if (error) {
        if (isNetworkError(error)) break;
        continue; // a validation problem would never succeed; keep it for manual review
      }
      await remove(record.id);
      synced += 1;
    }
    return synced;
  },
};
