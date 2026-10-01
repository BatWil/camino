import type { Expectation, FaithStatus, GrowthArea } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";
import type { OnboardingResult } from "../domain/flow";

export interface OnboardingAnswers {
  displayName: string;
  birthDate: string;
  faithStatus: FaithStatus;
  growthAreas: GrowthArea[];
  expectations: Expectation[];
}

export const onboardingRepository = {
  /** Validated and applied server-side (complete_onboarding RPC computes the starting stage). */
  async complete(answers: OnboardingAnswers): Promise<OnboardingResult> {
    const { data, error } = await requireSupabase().rpc("complete_onboarding", {
      p_display_name: answers.displayName,
      p_birth_date: answers.birthDate,
      p_faith_status: answers.faithStatus,
      p_growth_areas: answers.growthAreas,
      p_expectations: answers.expectations,
    });
    if (error) {
      if (error.hint === "min_age")
        throw new AppError("min_age", "Camino es para jóvenes de 13 años en adelante.", error);
      if (error.code === "22023")
        throw new AppError("invalid_input", "Revisa tus respuestas e inténtalo de nuevo.", error);
      throw new AppError("unknown", "No pudimos guardar tus respuestas. Inténtalo de nuevo.", error);
    }
    const row = data?.[0];
    if (!row) throw new AppError("unknown", "No pudimos preparar tu camino.");
    return { stageKey: row.stage_key, stageName: row.stage_name, stageDescription: row.stage_description };
  },
};
