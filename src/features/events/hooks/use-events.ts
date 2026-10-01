"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useCurrentChurch } from "@/features/churches/hooks/use-access";
import { analytics } from "@/lib/analytics";
import { eventsRepository } from "../data/events.repository";

export function useUpcomingEvents(limit = 20) {
  const { church } = useCurrentChurch();
  return useQuery({
    queryKey: ["events", "upcoming", church?.churchId, limit],
    queryFn: () => eventsRepository.upcoming(church!.churchId, limit),
    enabled: Boolean(church),
    staleTime: 5 * 60_000,
  });
}

export function useMyRegistrations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["events", "registrations", user?.id],
    queryFn: () => eventsRepository.myRegistrations(user!.id),
    enabled: Boolean(user),
  });
}

export function useEvent(id: string | null) {
  const event = useQuery({
    queryKey: ["events", "detail", id],
    queryFn: () => eventsRepository.get(id!),
    enabled: Boolean(id),
  });
  const attendance = useQuery({
    queryKey: ["events", "attendance", id],
    queryFn: () => eventsRepository.attendance(id!),
    enabled: Boolean(id) && Boolean(event.data),
  });
  return { event, attendance };
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { eventId: string; register: boolean }) =>
      eventsRepository.register(input.eventId, input.register),
    onSuccess: (_d, input) => {
      if (input.register) analytics.track("event_registered", { event_id: input.eventId });
      void queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
