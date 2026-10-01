"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { JournalKind } from "@/lib/supabase/database.types";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { AppError } from "@/types/result";
import { journalRepository, mergeEntries, type JournalDraft, type JournalEntry } from "../data/journal.repository";

export function useJournal(kind: JournalKind | "all") {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = ["journal", user?.id, kind];
  return useQuery({
    queryKey: key,
    // Offline: keep showing what was already loaded plus entries waiting to sync.
    queryFn: async () => {
      try {
        return await journalRepository.list(user!.id, kind);
      } catch (err) {
        if (!(err instanceof AppError) || err.code !== "offline") throw err;
        const previous = (queryClient.getQueryData<JournalEntry[]>(key) ?? []).filter((e) => !e.pendingSync);
        return mergeEntries(await journalRepository.queued(user!.id, kind), previous);
      }
    },
    enabled: Boolean(user),
    // The repository handles offline itself (cached + encrypted outbox), so never pause.
    networkMode: "always",
  });
}

export function useJournalEntry(id: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["journal", user?.id, "entry", id],
    queryFn: () => journalRepository.get(id!),
    enabled: Boolean(user && id),
  });
}

export function useJournalMutations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["journal"] });
    void queryClient.invalidateQueries({ queryKey: ["rhythm"] });
  };
  return {
    create: useMutation({
      mutationFn: (draft: JournalDraft) => journalRepository.create(user!.id, draft),
      onSuccess: refresh,
      networkMode: "always", // offline writes go to the encrypted outbox
    }),
    update: useMutation({
      mutationFn: ({
        id,
        ...patch
      }: Pick<JournalDraft, "id" | "kind" | "body" | "verse_ref" | "verse_text" | "entry_date">) =>
        journalRepository.update(id, patch),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: (id: string) => journalRepository.remove(id), onSuccess: refresh }),
  };
}

/** Syncs queued offline entries whenever the device is online. */
export function useJournalSync() {
  const { user } = useAuth();
  const online = useOnlineStatus();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!user || !online) return;
    journalRepository
      .flush(user.id)
      .then((n) => {
        if (n > 0) void queryClient.invalidateQueries({ queryKey: ["journal"] });
      })
      .catch(() => {});
  }, [user, online, queryClient]);
}
