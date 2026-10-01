"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { journeyRepository } from "../data/journey.repository";
import { buildJourney } from "../domain/journey";
import { useJourneyStages } from "./use-journey-stages";

export const journeyKeys = {
  modules: ["journey", "modules"] as const,
  progress: (userId: string) => ["journey", "progress", userId] as const,
};

/** Full "Mi Camino" view: stages × modules × my progress. */
export function useJourney() {
  const { user } = useAuth();
  const profile = useProfile();
  const stages = useJourneyStages();
  const modules = useQuery({
    queryKey: journeyKeys.modules,
    queryFn: () => journeyRepository.listModules(),
    enabled: Boolean(user),
    staleTime: 60 * 60_000,
  });
  const progress = useQuery({
    queryKey: journeyKeys.progress(user?.id ?? "anonymous"),
    queryFn: () => journeyRepository.myModuleProgress(),
    enabled: Boolean(user),
  });

  const queries = [profile, stages, modules, progress];
  const isPending = queries.some((q) => q.isPending);
  const isError = queries.some((q) => q.isError);
  const data =
    !isPending && !isError
      ? buildJourney(stages.data!, modules.data!, progress.data!, profile.data?.current_stage_id ?? null)
      : undefined;

  return {
    data,
    isPending,
    isError,
    refetch: () => Promise.all(queries.map((q) => q.refetch())),
  };
}
