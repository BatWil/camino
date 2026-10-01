import type { Mood, Tables } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";

export type CheckIn = Tables<"check_ins">;

/** Weekly check-ins. Private: RLS shows them only to their owner. */
export const checkinRepository = {
  async history(): Promise<CheckIn[]> {
    const { data, error } = await requireSupabase()
      .from("check_ins")
      .select("*")
      .order("week_start", { ascending: false })
      .limit(12);
    if (error) throw new AppError("unknown", "No pudimos cargar tus check-ins.", error);
    return data;
  },

  async save(input: { week_start: string; mood: Mood; note: string | null }) {
    const { error } = await requireSupabase()
      .from("check_ins")
      .upsert({ ...input, shared_with_mentor: false }, { onConflict: "user_id,week_start" });
    if (error) throw new AppError("unknown", "No pudimos guardar tu check-in.", error);
  },
};
