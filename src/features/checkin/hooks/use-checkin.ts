"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { localIsoDate, weekStart } from "@/features/rhythm/domain/rhythm";
import { checkinRepository } from "../data/checkin.repository";

export function useCheckins() {
  const { user } = useAuth();
  const thisWeek = localIsoDate(weekStart(new Date()));
  const history = useQuery({
    queryKey: ["checkins", user?.id],
    queryFn: () => checkinRepository.history(),
    enabled: Boolean(user),
  });
  return { history, thisWeek, current: history.data?.find((c) => c.week_start === thisWeek) ?? null };
}

export function useSaveCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkinRepository.save,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["checkins"] }),
  });
}
