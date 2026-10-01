"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccess } from "@/features/churches/hooks/use-access";
import { useAppStore } from "@/stores/app-store";
import { leaderRepository } from "../data/leader.repository";
import { leaderChurchId } from "../domain/leader";

export function useLeaderChurch() {
  const access = useAccess();
  const selected = useAppStore((s) => s.selectedChurchId);
  const churchId = access.data ? leaderChurchId(access.data, selected) : null;
  const name = access.data?.memberships.find((m) => m.churchId === churchId)?.churchName ?? null;
  return { churchId, churchName: name, isPending: access.isPending };
}

export function useLeaderOverview() {
  const { churchId } = useLeaderChurch();
  return useQuery({
    queryKey: ["leader", "overview", churchId],
    queryFn: () => leaderRepository.overview(churchId!),
    enabled: Boolean(churchId),
  });
}

export function useLeaderYouth() {
  const { churchId } = useLeaderChurch();
  return useQuery({
    queryKey: ["leader", "youth", churchId],
    queryFn: () => leaderRepository.youth(churchId!),
    enabled: Boolean(churchId),
  });
}

export function useLeaderRequests() {
  const { churchId } = useLeaderChurch();
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["leader"] });
  const requests = useQuery({
    queryKey: ["leader", "requests", churchId],
    queryFn: () => leaderRepository.requests(churchId!),
    enabled: Boolean(churchId),
  });
  const setStatus = useMutation({
    mutationFn: (input: { id: string; status: "scheduled" | "closed" }) =>
      leaderRepository.setRequestStatus(input.id, input.status),
    onSuccess: refresh,
  });
  const assign = useMutation({
    mutationFn: (input: { mentorId: string; menteeId: string }) =>
      leaderRepository.assignMentor(churchId!, input.mentorId, input.menteeId),
    onSuccess: refresh,
  });
  return { requests, setStatus, assign };
}
