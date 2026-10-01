"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useCurrentChurch } from "@/features/churches/hooks/use-access";
import { conferencesRepository } from "../data/conferences.repository";

export function useFeaturedConference() {
  return useQuery({
    queryKey: ["conferences", "featured"],
    queryFn: conferencesRepository.featured,
    staleTime: 10 * 60_000,
  });
}

export function useConference(id: string | null) {
  const { user } = useAuth();
  const { church } = useCurrentChurch();
  const conference = useQuery({
    queryKey: ["conferences", id],
    queryFn: () => conferencesRepository.get(id!),
    enabled: Boolean(id),
  });
  const registration = useQuery({
    queryKey: ["conferences", id, "registration", user?.id],
    queryFn: () => conferencesRepository.myRegistration(id!, user!.id),
    enabled: Boolean(id && user && conference.data),
  });
  const churchCount = useQuery({
    queryKey: ["conferences", id, "church", church?.churchId],
    queryFn: () => conferencesRepository.churchCount(id!, church!.churchId),
    enabled: Boolean(id && church && conference.data),
  });
  return { conference, registration, churchCount };
}

export function useConferenceRegister(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (register: boolean) => conferencesRepository.register(id, register),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conferences", id] }),
  });
}

export function useAgenda(conferenceId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sessions = useQuery({
    queryKey: ["conferences", conferenceId, "sessions"],
    queryFn: () => conferencesRepository.sessions(conferenceId!),
    enabled: Boolean(conferenceId),
  });
  const mine = useQuery({
    queryKey: ["conferences", "agenda", user?.id],
    queryFn: () => conferencesRepository.myAgenda(user!.id),
    enabled: Boolean(user),
  });
  const toggle = useMutation({
    mutationFn: (v: { sessionId: string; on: boolean }) => conferencesRepository.toggleAgenda(v.sessionId, v.on),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conferences", "agenda"] }),
  });
  return { sessions, mine, toggle };
}
