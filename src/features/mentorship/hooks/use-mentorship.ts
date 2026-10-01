"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { mentorshipRepository } from "../data/mentorship.repository";

export function useMyMentor() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mentor", "mine", user?.id],
    queryFn: () => mentorshipRepository.myMentor(),
    enabled: Boolean(user),
    staleTime: 5 * 60_000,
  });
}

export function useMyMentees(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mentor", "mentees", user?.id],
    queryFn: () => mentorshipRepository.myMentees(),
    enabled: Boolean(user) && enabled,
  });
}

export function useConversation(id: string | null) {
  const conversation = useQuery({
    queryKey: ["mentorship", id],
    queryFn: () => mentorshipRepository.conversation(id!),
    enabled: Boolean(id),
  });
  const messages = useQuery({
    queryKey: ["mentorship", id, "messages"],
    queryFn: () => mentorshipRepository.messages(id!),
    enabled: Boolean(id),
    // Light polling while the screen is open; no realtime socket needed.
    refetchInterval: 20_000,
  });
  const hasCheckins = (messages.data ?? []).some((m) => m.kind === "checkin");
  const checkins = useQuery({
    queryKey: ["mentorship", id, "checkins", messages.dataUpdatedAt],
    queryFn: () => mentorshipRepository.sharedCheckins(id!),
    enabled: Boolean(id) && hasCheckins,
  });
  return { conversation, messages, checkins };
}

export function useConversationActions(id: string) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["mentorship", id] });
  return {
    send: useMutation({ mutationFn: (body: string) => mentorshipRepository.send(id, body), onSuccess: refresh }),
    propose: useMutation({
      mutationFn: (input: { at: string; place: string | null }) =>
        mentorshipRepository.proposeMeeting(id, input.at, input.place),
      onSuccess: refresh,
    }),
    respond: useMutation({
      mutationFn: (input: { messageId: string; accept: boolean }) =>
        mentorshipRepository.respondMeeting(input.messageId, input.accept),
      onSuccess: refresh,
    }),
    report: useMutation({ mutationFn: mentorshipRepository.report }),
    end: useMutation({
      mutationFn: (reason: string | null) => mentorshipRepository.end(id, reason),
      onSuccess: () => {
        void refresh();
        void queryClient.invalidateQueries({ queryKey: ["mentor"] });
      },
    }),
  };
}

export function useShareCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (checkInId: string) => mentorshipRepository.shareCheckin(checkInId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["checkins"] });
      void queryClient.invalidateQueries({ queryKey: ["mentorship"] });
    },
  });
}
