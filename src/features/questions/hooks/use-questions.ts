"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useCurrentChurch } from "@/features/churches/hooks/use-access";
import { questionsRepository } from "../data/questions.repository";

export function useMyQuestions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["questions", "mine", user?.id],
    queryFn: () => questionsRepository.mine(user!.id),
    enabled: Boolean(user),
  });
}

export function useFaq() {
  const { church } = useCurrentChurch();
  return useQuery({
    queryKey: ["questions", "faq", church?.churchId],
    queryFn: () => questionsRepository.faq(church!.churchId),
    enabled: Boolean(church),
    staleTime: 10 * 60_000,
  });
}

export function useAskQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: questionsRepository.ask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questions", "mine"] }),
  });
}

export function useQuestionInbox(churchId: string | null) {
  const queryClient = useQueryClient();
  const inbox = useQuery({
    queryKey: ["questions", "inbox", churchId],
    queryFn: () => questionsRepository.inbox(churchId!),
    enabled: Boolean(churchId),
  });
  const answer = useMutation({
    mutationFn: (input: { id: string; body: string; publishFaq: boolean }) =>
      questionsRepository.answer(input.id, input.body, input.publishFaq),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["questions"] });
      void queryClient.invalidateQueries({ queryKey: ["leader"] });
    },
  });
  return { inbox, answer };
}
