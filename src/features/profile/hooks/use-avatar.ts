"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { prepareAvatar } from "@/utils/image";
import { avatarRepository } from "../data/avatar.repository";
import { useProfile } from "./use-profile";

/** Signed URL of the current user's avatar (private bucket), refreshed before it expires. */
export function useAvatarUrl() {
  const profile = useProfile();
  const path = profile.data?.avatar_path ?? null;
  const updatedAt = profile.data?.updated_at ?? "";
  return useQuery({
    queryKey: ["avatar-url", path, updatedAt],
    queryFn: () => avatarRepository.signedUrl(path!),
    enabled: Boolean(path),
    staleTime: 50 * 60_000,
  });
}

export function useUploadAvatar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: Blob) => avatarRepository.upload(user!.id, await prepareAvatar(file)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
}
