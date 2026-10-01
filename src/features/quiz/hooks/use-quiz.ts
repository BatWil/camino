"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { quizRepository } from "../data/quiz.repository";

export function useQuizBooks() {
  return useQuery({ queryKey: ["quiz", "books"], queryFn: quizRepository.books, staleTime: 10 * 60_000 });
}

export function useQuizQuestions(book: string | null) {
  return useQuery({
    queryKey: ["quiz", "questions", book],
    queryFn: () => quizRepository.questions(book!),
    enabled: Boolean(book),
    staleTime: 10 * 60_000,
  });
}

export function useQuizBest(book: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["quiz", "best", book, user?.id],
    queryFn: () => quizRepository.best(book!, user!.id),
    enabled: Boolean(book && user),
  });
}

export function useSaveAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: quizRepository.saveAttempt,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quiz", "best"] }),
  });
}
