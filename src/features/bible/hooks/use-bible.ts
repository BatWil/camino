"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { bibleUserRepository, type HighlightColor } from "../data/bible-user.repository";
import { staticBibleProvider } from "../data/bible-text.repository";

export function useBibleVersions() {
  return useQuery({
    queryKey: ["bible", "versions"],
    queryFn: () => staticBibleProvider.versions(),
    staleTime: Infinity,
  });
}

export function useChapterText(version: string | null, book: string, chapter: number) {
  return useQuery({
    queryKey: ["bible", "text", version, book, chapter],
    queryFn: () => staticBibleProvider.chapter(version!, book, chapter),
    enabled: Boolean(version),
    staleTime: Infinity,
    retry: 1,
  });
}

const marksKey = (userId: string, book: string, chapter: number) => ["bible", "marks", userId, book, chapter] as const;

export function useChapterMarks(book: string, chapter: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: marksKey(user?.id ?? "anonymous", book, chapter),
    queryFn: () => bibleUserRepository.chapterMarks(book, chapter),
    enabled: Boolean(user),
  });
}

export function useBibleActions(book: string, chapter: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: marksKey(user!.id, book, chapter) });
  return {
    highlight: useMutation({
      mutationFn: ({ verse, color }: { verse: number; color: HighlightColor | null }) =>
        bibleUserRepository.setHighlight(book, chapter, verse, color),
      onSuccess: refresh,
    }),
    bookmark: useMutation({
      mutationFn: ({ verse, on }: { verse: number; on: boolean }) =>
        bibleUserRepository.setBookmark(book, chapter, verse, on),
      onSuccess: refresh,
    }),
    note: useMutation({
      mutationFn: ({ verse, body }: { verse: number; body: string | null }) =>
        bibleUserRepository.saveNote(book, chapter, verse, body),
      onSuccess: refresh,
    }),
  };
}

export function useBibleSaved() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bible", "saved", user?.id],
    queryFn: () => bibleUserRepository.saved(),
    enabled: Boolean(user),
  });
}
