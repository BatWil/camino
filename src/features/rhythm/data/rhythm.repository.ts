import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";

export const rhythmRepository = {
  /** Days (yyyy-mm-dd) with any activity since `sinceIso`. Only dates, never content. */
  async activeDays(sinceIso: string): Promise<string[]> {
    const { data, error } = await requireSupabase().from("activity_days").select("day").gte("day", sinceIso);
    if (error) throw new AppError("unknown", "No pudimos cargar tu ritmo.", error);
    return data.map((d) => d.day);
  },

  /** Keeps profiles.timezone aligned with the device so "today" matches on the server. */
  async syncTimezone(userId: string, timezone: string): Promise<void> {
    const { error } = await requireSupabase().from("profiles").update({ timezone }).eq("id", userId);
    if (error) throw new AppError("unknown", "No pudimos guardar tu zona horaria.", error);
  },
};
