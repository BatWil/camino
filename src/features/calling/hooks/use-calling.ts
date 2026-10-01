"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useCurrentChurch } from "@/features/churches/hooks/use-access";
import { communityRepository } from "@/features/community/data/community.repository";
import { callingRepository } from "../data/calling.repository";

export function useCalling() {
  const { user } = useAuth();
  const { church } = useCurrentChurch();
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["calling"] });
    void queryClient.invalidateQueries({ queryKey: ["moments"] });
  };
  const progress = useQuery({
    queryKey: ["calling", "progress", user?.id],
    queryFn: callingRepository.progress,
    enabled: Boolean(user),
  });
  const stories = useQuery({
    queryKey: ["calling", "stories"],
    queryFn: callingRepository.stories,
    staleTime: 10 * 60_000,
  });
  return {
    progress,
    stories,
    start: useMutation({ mutationFn: callingRepository.start, onSuccess: refresh }),
    askPastor: useMutation({
      mutationFn: () => communityRepository.requestConversation(church!.churchId, "pastor", "llamado"),
      onSuccess: refresh,
    }),
    exploreStudies: useMutation({ mutationFn: () => callingRepository.exploreStudies(user!.id), onSuccess: refresh }),
    hasChurch: Boolean(church),
  };
}
