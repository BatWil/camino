import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";
import type { JourneyModule, ModuleProgress } from "../domain/journey";
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

  async listModules(): Promise<JourneyModule[]> {
    const { data, error } = await requireSupabase()
      .from("journey_modules")
      .select("id, stage_id, position, title, kind, devotional_id, plan_id, is_optional")
      .order("position");
    if (error) throw new AppError("unknown", "No pudimos cargar tu camino.", error);
    return data.map((m) => ({
      id: m.id,
      stageId: m.stage_id,
      position: m.position,
      title: m.title,
      kind: m.kind,
      devotionalId: m.devotional_id,
      planId: m.plan_id,
      optional: m.is_optional,
    }));
  },

  /** RLS returns only the caller's rows. */
  async myModuleProgress(): Promise<ModuleProgress[]> {
    const { data, error } = await requireSupabase().from("user_module_progress").select("module_id, status");
    if (error) throw new AppError("unknown", "No pudimos cargar tu progreso.", error);
    return data.map((p) => ({ moduleId: p.module_id, status: p.status }));
  },
};
