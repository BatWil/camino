"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { analytics } from "@/lib/analytics";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { prayerRepository, type Prayer, type PrayerInput } from "../data/prayer.repository";

export function useMyPrayers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["prayers", user?.id],
    queryFn: () => prayerRepository.mine(user!.id),
    enabled: Boolean(user),
  });
}

export function usePrayer(id: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["prayers", user?.id, "one", id],
    queryFn: () => prayerRepository.get(id!),
    enabled: Boolean(user && id),
  });
}

export function usePrayerMutations() {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["prayers"] });
    void queryClient.invalidateQueries({ queryKey: ["moments"] });
  };
  return {
    create: useMutation({
      mutationFn: (input: PrayerInput) => prayerRepository.create(input),
      onSuccess: (_d, input) => {
        analytics.track("prayer_created", { privacy: input.privacy });
        refresh();
      },
    }),
    update: useMutation({
      mutationFn: ({ id, ...patch }: Partial<PrayerInput> & { id: string }) => prayerRepository.update(id, patch),
      onSuccess: refresh,
    }),
    setStatus: useMutation({
      mutationFn: ({ id, status }: { id: string; status: Prayer["status"] }) => prayerRepository.setStatus(id, status),
      onSuccess: (_d, v) => {
        if (v.status === "ANSWERED") analytics.track("prayer_answered", {});
        refresh();
      },
    }),
    remove: useMutation({ mutationFn: (id: string) => prayerRepository.remove(id), onSuccess: refresh }),
    logSession: useMutation({
      mutationFn: (seconds: number) => prayerRepository.logSession(seconds),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rhythm"] }),
    }),
  };
}
