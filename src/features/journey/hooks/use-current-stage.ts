"use client";

import { useProfile } from "@/features/profile/hooks/use-profile";
import { useJourneyStages } from "./use-journey-stages";

/** The person's current stage (set by onboarding; advanced by progress in M2). */
export function useCurrentStage() {
  const profile = useProfile();
  const stages = useJourneyStages();
  const id = profile.data?.current_stage_id ?? null;
  return {
    isPending: profile.isPending || stages.isPending,
    stage: id ? (stages.data?.find((s) => s.id === id) ?? null) : null,
    stages: stages.data ?? [],
  };
}
