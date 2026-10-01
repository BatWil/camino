import type { Database, FineArtsCategory, Tables } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";
import { storageKey, validateUpload } from "../domain/fine-arts";

export type FineArtsEntry = Tables<"fine_arts_entries">;
export type LeaderEntry = Database["public"]["Functions"]["leader_fine_arts"]["Returns"][number];

const BUCKET = "fine-arts";

export const fineArtsRepository = {
  async mine(userId: string): Promise<FineArtsEntry[]> {
    const { data, error } = await requireSupabase()
      .from("fine_arts_entries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new AppError("unknown", "No pudimos cargar tus presentaciones.", error);
    return data;
  },

  async create(input: {
    churchId: string;
    conferenceId: string | null;
    category: FineArtsCategory;
    title: string | null;
  }) {
    const id = crypto.randomUUID();
    const { error } = await requireSupabase().from("fine_arts_entries").insert({
      id,
      church_id: input.churchId,
      conference_id: input.conferenceId,
      category: input.category,
      title: input.title,
    });
    if (error) throw new AppError("unknown", "No pudimos crear tu inscripción.", error);
    return id;
  },

  async update(id: string, patch: Database["public"]["Tables"]["fine_arts_entries"]["Update"]) {
    const { error } = await requireSupabase().from("fine_arts_entries").update(patch).eq("id", id);
    if (error) throw new AppError("unknown", "No pudimos guardar los cambios.", error);
  },

  /** Uploads to the private bucket under the owner's folder, then links it to the entry. */
  async upload(entryId: string, userId: string, file: File) {
    const problem = validateUpload(file);
    if (problem) throw new AppError("invalid_input", problem);
    const key = storageKey(userId, file.type, crypto.randomUUID());
    const sb = requireSupabase();
    const { error } = await sb.storage.from(BUCKET).upload(key, file, { contentType: file.type, upsert: false });
    if (error) throw new AppError("unknown", "No pudimos subir tu archivo.", error);
    await this.update(entryId, { file_path: key, file_mime: file.type });
  },

  async submit(id: string) {
    await this.update(id, { status: "submitted" });
  },

  async remove(id: string) {
    const { error } = await requireSupabase().from("fine_arts_entries").delete().eq("id", id);
    if (error) throw new AppError("unknown", "No pudimos borrar la inscripción.", error);
  },

  async signedUrl(path: string): Promise<string> {
    const { data, error } = await requireSupabase().storage.from(BUCKET).createSignedUrl(path, 600);
    if (error || !data) throw new AppError("unknown", "No pudimos abrir el archivo.", error);
    return data.signedUrl;
  },

  async leaderList(churchId: string): Promise<LeaderEntry[]> {
    const { data, error } = await requireSupabase().rpc("leader_fine_arts", { p_church_id: churchId });
    if (error) throw new AppError("unknown", "No pudimos cargar las presentaciones.", error);
    return data;
  },

  async review(id: string, approve: boolean, note: string | null) {
    const { error } = await requireSupabase().rpc("review_fine_arts_entry", {
      p_entry_id: id,
      p_approve: approve,
      p_note: note,
    });
    if (error) throw new AppError("unknown", "No pudimos guardar la revisión.", error);
  },
};
