"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useAppStore } from "@/stores/app-store";
import { accessRepository } from "../data/access.repository";
import { EMPTY_ACCESS, resolveCurrentChurch } from "../domain/access";

export const accessKeys = {
  mine: (userId: string) => ["access", userId] as const,
};

export function useAccess() {
  const { user } = useAuth();
  return useQuery({
    queryKey: accessKeys.mine(user?.id ?? "anonymous"),
    queryFn: () => accessRepository.getMine(user!.id),
    enabled: Boolean(user),
    staleTime: 5 * 60_000,
  });
}

export function useCurrentChurch() {
  const access = useAccess();
  const selectedChurchId = useAppStore((s) => s.selectedChurchId);
  return {
    ...access,
    church: resolveCurrentChurch(access.data ?? EMPTY_ACCESS, selectedChurchId),
  };
}
