"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { analytics } from "@/lib/analytics";
import { useAppStore } from "@/stores/app-store";
import { churchRepository } from "../data/church.repository";
import { isCompleteChurchCode } from "../domain/church-code";

export function useChurchPreview(code: string) {
  return useQuery({
    queryKey: ["church-preview", code],
    queryFn: () => churchRepository.preview(code),
    enabled: isCompleteChurchCode(code),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useJoinChurch() {
  const queryClient = useQueryClient();
  const setSelectedChurch = useAppStore((s) => s.setSelectedChurch);
  return useMutation({
    mutationFn: ({ code }: { code: string; method: "code" | "qr" | "link" }) => churchRepository.join(code),
    onSuccess: async (church, { method }) => {
      setSelectedChurch(church.churchId);
      analytics.track("church_joined", { method });
      await queryClient.invalidateQueries({ queryKey: ["access"] });
    },
  });
}
