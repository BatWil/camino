"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { profileRepository } from "../data/profile.repository";

export const profileKeys = {
  own: (userId: string) => ["profile", userId] as const,
};

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: profileKeys.own(user?.id ?? "anonymous"),
    queryFn: () => profileRepository.getOwn(user!.id),
    enabled: Boolean(user),
    staleTime: 5 * 60_000,
  });
}
