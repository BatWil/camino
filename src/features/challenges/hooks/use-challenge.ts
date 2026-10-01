"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { localIsoDate, weekStart } from "@/features/rhythm/domain/rhythm";
import { challengeRepository } from "../data/challenge.repository";

/** The challenge to show: a specific one by id, or the current weekly challenge. */
export function useChallenge(id?: string | null) {
  const { user } = useAuth();
  const list = useQuery({
    queryKey: ["challenges", "weekly"],
    queryFn: () => challengeRepository.listWeekly(),
    enabled: Boolean(user),
    staleTime: 10 * 60_000,
  });
  const challenge = list.data ? ((id ? list.data.find((c) => c.id === id) : list.data[0]) ?? null) : undefined;
  const since = localIsoDate(weekStart(new Date()));
  const checkins = useQuery({
    queryKey: ["challenges", "checkins", user?.id ?? "anonymous", challenge?.id ?? "none", since],
    queryFn: () => challengeRepository.myCheckins(challenge!.id, since),
    enabled: Boolean(user && challenge),
  });
  return { list, challenge, checkins };
}

export function useChallengeCheckin(challengeId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (done: boolean) => challengeRepository.checkin(challengeId!, done),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["challenges", "checkins"] }),
        queryClient.invalidateQueries({ queryKey: ["rhythm"] }),
      ]);
    },
  });
}
