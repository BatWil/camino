import type { MomentKind, Tables } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";
import type { StoryStats } from "@/features/story/domain/story";

export type Moment = Tables<"moments">;

export const momentsRepository = {
  async list(): Promise<Moment[]> {
    const { data, error } = await requireSupabase()
      .from("moments")
      .select("*")
      .order("happened_on", { ascending: false });
    if (error) throw new AppError("unknown", "No pudimos cargar tus momentos.", error);
    return data;
  },

  async add(input: { kind: MomentKind; title: string; note: string | null; happened_on: string }) {
    const { error } = await requireSupabase().from("moments").insert(input);
    if (error) throw new AppError("unknown", "No pudimos guardar el momento.", error);
  },

  async remove(id: string) {
    const { error } = await requireSupabase().from("moments").delete().eq("id", id);
    if (error) throw new AppError("unknown", "No pudimos borrar el momento.", error);
  },

  async stats(): Promise<StoryStats> {
    const { data, error } = await requireSupabase().rpc("my_story_stats");
    if (error) throw new AppError("unknown", "No pudimos preparar tu historia.", error);
    const r = (data ?? {}) as Record<string, unknown>;
    const n = (k: string) => Number(r[k] ?? 0) || 0;
    const s = (k: string) => (typeof r[k] === "string" ? (r[k] as string) : null);
    return {
      activeDays: n("active_days"),
      journalEntries: n("journal_entries"),
      firstJournalAt: s("first_journal_at"),
      answeredPrayers: n("answered_prayers"),
      prayerMinutes: n("prayer_minutes"),
      plansCompleted: n("plans_completed"),
      devotionalsCompleted: n("devotionals_completed"),
      startedAt: s("started_at"),
    };
  },

  async firstJournalSnippet(): Promise<{ body: string; created_at: string } | null> {
    const { data, error } = await requireSupabase()
      .from("journal_entries")
      .select("body, created_at")
      .order("created_at")
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data;
  },
};
