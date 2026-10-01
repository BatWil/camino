import type { PrayerCategory, PrayerPrivacy, Tables } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";

export type Prayer = Tables<"prayers">;

export interface PrayerInput {
  title: string;
  description: string | null;
  category: PrayerCategory;
  privacy: PrayerPrivacy;
  group_id: string | null;
  church_id: string | null;
  verse_ref: string | null;
}

/** Prayers. RLS: owner manages; GROUP/CHURCH prayers are readable by those members only. */
export const prayerRepository = {
  async mine(userId: string): Promise<Prayer[]> {
    const { data, error } = await requireSupabase()
      .from("prayers")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new AppError("unknown", "No pudimos cargar tus peticiones.", error);
    return data;
  },

  async get(id: string): Promise<Prayer | null> {
    const { data, error } = await requireSupabase().from("prayers").select("*").eq("id", id).maybeSingle();
    if (error) throw new AppError("unknown", "No pudimos cargar la petición.", error);
    return data;
  },

  async create(input: PrayerInput) {
    const { error } = await requireSupabase().from("prayers").insert(input);
    if (error) throw new AppError("unknown", "No pudimos guardar tu petición.", error);
  },

  async update(id: string, patch: Partial<PrayerInput>) {
    const { error } = await requireSupabase().from("prayers").update(patch).eq("id", id);
    if (error) throw new AppError("unknown", "No pudimos guardar los cambios.", error);
  },

  async setStatus(id: string, status: Prayer["status"]) {
    const { error } = await requireSupabase().from("prayers").update({ status }).eq("id", id);
    if (error) throw new AppError("unknown", "No pudimos actualizar la petición.", error);
  },

  async remove(id: string) {
    const { error } = await requireSupabase().from("prayers").delete().eq("id", id);
    if (error) throw new AppError("unknown", "No pudimos borrar la petición.", error);
  },

  async logSession(seconds: number) {
    const { error } = await requireSupabase()
      .from("prayer_sessions")
      .insert({ seconds: Math.min(14400, Math.max(1, Math.round(seconds))) });
    if (error) throw new AppError("unknown", "No pudimos guardar tu tiempo de oración.", error);
  },
};
