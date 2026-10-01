"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useCurrentChurch } from "@/features/churches/hooks/use-access";
import type { GiftArea } from "@/lib/supabase/database.types";
import { analytics } from "@/lib/analytics";
import { serviceRepository } from "../data/service.repository";
import { parseScores } from "../domain/gifts";

export function useOpportunities() {
  const { church } = useCurrentChurch();
  return useQuery({
    queryKey: ["service", "opportunities", church?.churchId],
    queryFn: () => serviceRepository.opportunities(church!.churchId),
    enabled: Boolean(church),
  });
}

export function useMyServiceRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["service", "requests", user?.id],
    queryFn: () => serviceRepository.myRequests(user!.id),
    enabled: Boolean(user),
  });
}

export function useMyGifts() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["service", "gifts", user?.id],
    queryFn: () => serviceRepository.myGifts(user!.id),
    enabled: Boolean(user),
  });
  return { ...query, scores: query.data ? parseScores(query.data.scores) : null };
}

export function useServiceActions() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["service"] });
  return {
    interested: useMutation({
      mutationFn: (opportunityId: string) => serviceRepository.interested(opportunityId),
      onSuccess: (_d, opportunityId) => {
        analytics.track("service_interest", { opportunity_id: opportunityId });
        void refresh();
      },
    }),
    withdraw: useMutation({ mutationFn: (id: string) => serviceRepository.withdraw(id), onSuccess: refresh }),
    saveGifts: useMutation({
      mutationFn: (input: { answers: Record<string, number>; scores: Partial<Record<GiftArea, number>> }) =>
        serviceRepository.saveGifts(input.answers, input.scores),
      onSuccess: refresh,
    }),
  };
}
