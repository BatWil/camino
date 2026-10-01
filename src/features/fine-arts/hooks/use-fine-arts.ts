"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { fineArtsRepository } from "../data/fine-arts.repository";

export function useMyEntries() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["fine-arts", "mine", user?.id],
    queryFn: () => fineArtsRepository.mine(user!.id),
    enabled: Boolean(user),
  });
}

export function useFineArtsActions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["fine-arts"] });
  return {
    create: useMutation({ mutationFn: fineArtsRepository.create, onSuccess: refresh }),
    update: useMutation({
      mutationFn: (v: { id: string; patch: Parameters<typeof fineArtsRepository.update>[1] }) =>
        fineArtsRepository.update(v.id, v.patch),
      onSuccess: refresh,
    }),
    upload: useMutation({
      mutationFn: (v: { id: string; file: File }) => fineArtsRepository.upload(v.id, user!.id, v.file),
      onSuccess: refresh,
    }),
    submit: useMutation({ mutationFn: (id: string) => fineArtsRepository.submit(id), onSuccess: refresh }),
    remove: useMutation({ mutationFn: (id: string) => fineArtsRepository.remove(id), onSuccess: refresh }),
  };
}
