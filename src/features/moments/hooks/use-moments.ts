"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { momentsRepository } from "../data/moments.repository";

export function useMoments() {
  const { user } = useAuth();
  return useQuery({ queryKey: ["moments", user?.id], queryFn: () => momentsRepository.list(), enabled: Boolean(user) });
}

export function useMomentMutations() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["moments"] });
  return {
    add: useMutation({ mutationFn: momentsRepository.add, onSuccess: refresh }),
    remove: useMutation({ mutationFn: momentsRepository.remove, onSuccess: refresh }),
  };
}

export function useStory() {
  const { user } = useAuth();
  const stats = useQuery({
    queryKey: ["story", user?.id],
    queryFn: () => momentsRepository.stats(),
    enabled: Boolean(user),
  });
  const first = useQuery({
    queryKey: ["story", user?.id, "first"],
    queryFn: () => momentsRepository.firstJournalSnippet(),
    enabled: Boolean(user),
  });
  return { stats, first };
}
