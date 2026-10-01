"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useCurrentChurch } from "@/features/churches/hooks/use-access";
import { analytics } from "@/lib/analytics";
import { communityRepository } from "../data/community.repository";

export function useActiveSeries() {
  const { church } = useCurrentChurch();
  return useQuery({
    queryKey: ["series", church?.churchId],
    queryFn: () => communityRepository.activeSeries(church!.churchId),
    enabled: Boolean(church),
    staleTime: 10 * 60_000,
  });
}

export function useMyGroup() {
  const { user } = useAuth();
  const { church } = useCurrentChurch();
  return useQuery({
    queryKey: ["group", "mine", user?.id, church?.churchId],
    queryFn: () => communityRepository.myGroup(user!.id, church!.churchId),
    enabled: Boolean(user && church),
    staleTime: 5 * 60_000,
  });
}

export function useRoster(groupId: string | null | undefined) {
  return useQuery({
    queryKey: ["group", "roster", groupId],
    queryFn: () => communityRepository.roster(groupId!),
    enabled: Boolean(groupId),
    staleTime: 5 * 60_000,
  });
}

export function useSharedPrayers() {
  const { church } = useCurrentChurch();
  return useQuery({
    queryKey: ["prayers", "shared", church?.churchId],
    queryFn: () => communityRepository.sharedPrayers(church!.churchId),
    enabled: Boolean(church),
  });
}

export function usePrayFor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prayerId: string) => communityRepository.pray(prayerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prayers", "shared"] }),
  });
}

export function useConversationRequest() {
  const { user } = useAuth();
  const { church } = useCurrentChurch();
  const queryClient = useQueryClient();
  const open = useQuery({
    queryKey: ["conversation-request", user?.id],
    queryFn: () => communityRepository.openConversationRequest(user!.id),
    enabled: Boolean(user),
  });
  const request = useMutation({
    mutationFn: (input: { withRole: "mentor" | "pastor" | "leader"; topic: string | null }) =>
      communityRepository.requestConversation(church!.churchId, input.withRole, input.topic),
    onSuccess: () => {
      analytics.track("mentor_request", {});
      void queryClient.invalidateQueries({ queryKey: ["conversation-request"] });
    },
  });
  return { open, request };
}

export function usePlanCompanions(userPlanId: string | null) {
  const queryClient = useQueryClient();
  const companions = useQuery({
    queryKey: ["plan-companions", userPlanId],
    queryFn: () => communityRepository.planCompanions(userPlanId!),
    enabled: Boolean(userPlanId),
  });
  const invite = useMutation({
    mutationFn: (companionId: string) => communityRepository.invitePlanCompanion(userPlanId!, companionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plan-companions", userPlanId] }),
  });
  return { companions, invite };
}

export function usePlanInvites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const invites = useQuery({
    queryKey: ["plan-invites", user?.id],
    queryFn: () => communityRepository.planInvites(),
    enabled: Boolean(user),
  });
  const respond = useMutation({
    mutationFn: (input: { id: string; accept: boolean }) =>
      communityRepository.respondPlanInvite(input.id, input.accept),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["plan-invites"] });
      void queryClient.invalidateQueries({ queryKey: ["plans", "mine"] });
    },
  });
  return { invites, respond };
}
