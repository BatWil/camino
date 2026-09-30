import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";
import { sortStages, type JourneyStage } from "../domain/stages";

export const journeyRepository = {
  async listStages(): Promise<JourneyStage[]> {
    const { data, error } = await requireSupabase()
      .from("journey_stages")
      .select("id, key, position, name, description")
      .order("position");
    if (error) throw new AppError("unknown", "No pudimos cargar tu camino.", error);
    return sortStages(data);
  },
};
