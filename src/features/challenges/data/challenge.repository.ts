import type { Tables } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";

export type Challenge = Tables<"challenges">;

export const challengeRepository = {
  /** Visible weekly challenges; church challenges first, then platform ones. */
  async listWeekly(): Promise<Challenge[]> {
    const { data, error } = await requireSupabase()
      .from("challenges")
      .select("*")
      .eq("is_published", true)
      .eq("kind", "weekly")
      .order("created_at", { ascending: false });
    if (error) throw new AppError("unknown", "No pudimos cargar el reto.", error);
    return [...data].sort((a, b) => (a.source === b.source ? 0 : a.source === "CHURCH" ? -1 : 1));
  },

  async myCheckins(challengeId: string, sinceIso: string): Promise<string[]> {
    const { data, error } = await requireSupabase()
      .from("challenge_checkins")
      .select("day")
      .eq("challenge_id", challengeId)
      .gte("day", sinceIso)
      .order("day");
    if (error) throw new AppError("unknown", "No pudimos cargar tu reto.", error);
    return data.map((d) => d.day);
  },

  async checkin(challengeId: string, done: boolean): Promise<number> {
    const { data, error } = await requireSupabase().rpc("challenge_checkin", {
      p_challenge_id: challengeId,
      p_done: done,
    });
    if (error) throw new AppError("unknown", "No pudimos guardar tu reto.", error);
    return data ?? 0;
  },
};
