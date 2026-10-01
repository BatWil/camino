import type { DevotionalStep, Tables } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";
import type { DevotionalSummary, InProgressDevotional } from "@/features/today/domain/next-step";

export type Devotional = Tables<"devotionals">;
export type DevotionalProgress = Tables<"devotional_progress">;

export interface CompletionResult {
  planCompleted: boolean;
  stageAdvanced: boolean;
  stageKey: string | null;
  stageName: string | null;
}

export const devotionalRepository = {
  async get(id: string): Promise<Devotional | null> {
    const { data, error } = await requireSupabase().from("devotionals").select("*").eq("id", id).maybeSingle();
    if (error) throw new AppError("unknown", "No pudimos cargar el devocional.", error);
    return data;
  },

  async myProgress(id: string): Promise<DevotionalProgress | null> {
    const { data, error } = await requireSupabase()
      .from("devotional_progress")
      .select("*")
      .eq("devotional_id", id)
      .maybeSingle();
    if (error) throw new AppError("unknown", "No pudimos cargar tu progreso.", error);
    return data;
  },

  async myInProgress(): Promise<InProgressDevotional[]> {
    const { data, error } = await requireSupabase()
      .from("devotional_progress")
      .select("completed_steps, updated_at, devotionals ( id, title, minutes, scripture_ref )")
      .eq("status", "in_progress")
      .order("updated_at", { ascending: false })
      .limit(5);
    if (error) throw new AppError("unknown", "No pudimos cargar tu progreso.", error);
    return data
      .filter((row) => row.devotionals)
      .map((row) => ({
        devotional: toSummary(row.devotionals!),
        completedSteps: row.completed_steps,
        updatedAt: row.updated_at,
      }));
  },

  async getSummary(id: string): Promise<DevotionalSummary | null> {
    const { data, error } = await requireSupabase()
      .from("devotionals")
      .select("id, title, minutes, scripture_ref")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new AppError("unknown", "No pudimos cargar el devocional.", error);
    return data ? toSummary(data) : null;
  },

  async saveProgress(id: string, steps: DevotionalStep[], answer: string | null): Promise<void> {
    const { error } = await requireSupabase().rpc("save_devotional_progress", {
      p_devotional_id: id,
      p_steps: steps,
      p_answer: answer,
    });
    if (error) throw new AppError("unknown", "No pudimos guardar tu avance.", error);
  },

  async complete(id: string, answer: string | null, userPlanId: string | null): Promise<CompletionResult> {
    const { data, error } = await requireSupabase().rpc("complete_devotional", {
      p_devotional_id: id,
      p_answer: answer,
      p_user_plan_id: userPlanId,
    });
    if (error) throw new AppError("unknown", "No pudimos completar el devocional. Inténtalo de nuevo.", error);
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      planCompleted: r.plan_completed === true,
      stageAdvanced: r.stage_advanced === true,
      stageKey: typeof r.stage_key === "string" ? r.stage_key : null,
      stageName: typeof r.stage_name === "string" ? r.stage_name : null,
    };
  },
};

function toSummary(d: { id: string; title: string; minutes: number; scripture_ref: string }): DevotionalSummary {
  return { id: d.id, title: d.title, minutes: d.minutes, scriptureRef: d.scripture_ref };
}
