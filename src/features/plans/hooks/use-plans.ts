"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { analytics } from "@/lib/analytics";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { planRepository } from "../data/plan.repository";

export function usePlanLibrary() {
  const { user } = useAuth();
  const plans = useQuery({
    queryKey: ["plans", "library"],
    queryFn: () => planRepository.list(),
    enabled: Boolean(user),
    staleTime: 10 * 60_000,
  });
  const counts = useQuery({
    queryKey: ["plans", "day-counts"],
    queryFn: () => planRepository.dayCounts(),
    enabled: Boolean(user),
    staleTime: 10 * 60_000,
  });
  return { plans, counts };
}

export function usePlan(id: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["plans", "detail", id],
    queryFn: () => planRepository.get(id!),
    enabled: Boolean(user && id),
    staleTime: 10 * 60_000,
  });
}

export function useMyPlans() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["plans", "mine", user?.id ?? "anonymous"],
    queryFn: () => planRepository.mine(),
    enabled: Boolean(user),
  });
}

export function useStartPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => planRepository.start(planId),
    onSuccess: async (_userPlanId, planId) => {
      analytics.track("plan_started", { plan_id: planId });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["plans", "mine"] }),
        queryClient.invalidateQueries({ queryKey: ["journey", "progress"] }),
      ]);
    },
  });
}
