"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { devotionalRepository } from "@/features/devotionals/data/devotional.repository";
import { useInProgressDevotionals } from "@/features/devotionals/hooks/use-devotional";
import { nextModule } from "@/features/journey/domain/journey";
import { useJourney } from "@/features/journey/hooks/use-journey";
import { useMyPlans } from "@/features/plans/hooks/use-plans";
import { chooseTodayStep, type SuggestedModule, type TodayStep } from "../domain/next-step";

/** "¿Cuál es mi siguiente paso hoy?" from real progress. */
export function useTodayStep(): { step: TodayStep | null; isPending: boolean; isError: boolean } {
  const { user } = useAuth();
  const plans = useMyPlans();
  const inProgress = useInProgressDevotionals();
  const journey = useJourney();
  const nextUp = journey.data ? nextModule(journey.data) : null;

  const suggestedDevotional = useQuery({
    queryKey: ["devotional-summary", nextUp?.devotionalId ?? "none"],
    queryFn: () => devotionalRepository.getSummary(nextUp!.devotionalId!),
    enabled: Boolean(user && nextUp?.devotionalId),
    staleTime: 60 * 60_000,
  });

  const isPending =
    plans.isPending ||
    inProgress.isPending ||
    journey.isPending ||
    (Boolean(nextUp?.devotionalId) && suggestedDevotional.isPending);
  const isError = plans.isError || inProgress.isError || journey.isError;
  if (isPending || isError) return { step: null, isPending, isError };

  const suggested: SuggestedModule | null = nextUp
    ? { title: nextUp.title, kind: nextUp.kind, devotional: suggestedDevotional.data ?? null, planId: nextUp.planId }
    : null;

  return {
    step: chooseTodayStep({
      activePlans: (plans.data ?? []).filter((p) => p.status === "active"),
      inProgress: inProgress.data ?? [],
      suggested,
    }),
    isPending: false,
    isError: false,
  };
}
