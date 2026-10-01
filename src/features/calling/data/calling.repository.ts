import type { Tables } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";
import { parseCallingProgress, type CallingProgress } from "../domain/calling";

export const callingRepository = {
  async progress(): Promise<CallingProgress> {
    const { data, error } = await requireSupabase().rpc("my_calling_progress");
    if (error) throw new AppError("unknown", "No pudimos cargar tu camino.", error);
    return parseCallingProgress(data);
  },

  async start() {
    const { error } = await requireSupabase().rpc("start_calling_journey");
    if (error) throw new AppError("unknown", "No pudimos guardar tu decisión.", error);
  },

  async exploreStudies(userId: string) {
    const { error } = await requireSupabase()
      .from("calling_journeys")
      .update({ studies_explored_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) throw new AppError("unknown", "No pudimos guardar el paso.", error);
  },

  async stories(): Promise<Tables<"calling_stories">[]> {
    const { data, error } = await requireSupabase().from("calling_stories").select("*").limit(5);
    if (error) throw new AppError("unknown", "No pudimos cargar las historias.", error);
    return data;
  },
};
