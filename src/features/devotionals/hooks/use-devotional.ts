"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DevotionalStep } from "@/lib/supabase/database.types";
import { analytics } from "@/lib/analytics";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { devotionalRepository } from "../data/devotional.repository";

export const devotionalKeys = {
  detail: (id: string) => ["devotional", id] as const,
  progress: (userId: string, id: string) => ["devotional-progress", userId, id] as const,
  inProgress: (userId: string) => ["devotional-progress", userId, "in-progress"] as const,
};

/** Everything that a completion can change (plan day, plan, module, stage, rhythm). */
export const PROGRESS_QUERY_ROOTS = [
  ["devotional-progress"],
  ["plans", "mine"],
  ["journey", "progress"],
  ["rhythm"],
  ["profile"],
] as const;

export function useDevotional(id: string | null) {
  const { user } = useAuth();
  const detail = useQuery({
    queryKey: devotionalKeys.detail(id ?? "none"),
    queryFn: () => devotionalRepository.get(id!),
    enabled: Boolean(user && id),
    staleTime: 60 * 60_000,
  });
  const progress = useQuery({
    queryKey: devotionalKeys.progress(user?.id ?? "anonymous", id ?? "none"),
    queryFn: () => devotionalRepository.myProgress(id!),
    enabled: Boolean(user && id),
  });
  return { detail, progress };
}

export function useSaveDevotionalProgress(id: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ steps, answer }: { steps: DevotionalStep[]; answer: string | null }) =>
      devotionalRepository.saveProgress(id, steps, answer),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: devotionalKeys.progress(user!.id, id) });
      void queryClient.invalidateQueries({ queryKey: ["rhythm"] });
    },
  });
}

export function useCompleteDevotional(id: string, userPlanId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answer: string | null) => devotionalRepository.complete(id, answer, userPlanId),
    onSuccess: async (result) => {
      analytics.track("devotional_completed", { devotional_id: id });
      if (result.planCompleted && userPlanId) analytics.track("plan_completed", { plan_id: userPlanId });
      await Promise.all(PROGRESS_QUERY_ROOTS.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
  });
}

export function useInProgressDevotionals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: devotionalKeys.inProgress(user?.id ?? "anonymous"),
    queryFn: () => devotionalRepository.myInProgress(),
    enabled: Boolean(user),
  });
}
