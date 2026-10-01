"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { rhythmRepository } from "../data/rhythm.repository";
import { addDays, computeRhythm, localIsoDate } from "../domain/rhythm";

export function useRhythm() {
  const { user } = useAuth();
  const today = new Date();
  const since = localIsoDate(addDays(today, -6));
  return useQuery({
    queryKey: ["rhythm", user?.id ?? "anonymous", since],
    queryFn: () => rhythmRepository.activeDays(since),
    enabled: Boolean(user),
    select: (days) => computeRhythm(days, today),
  });
}

function deviceTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/** Mirrors the device timezone into the profile so the server's "today" matches the person's day. */
export function useTimezoneSync() {
  const { user } = useAuth();
  const profile = useProfile();
  const queryClient = useQueryClient();
  const current = profile.data?.timezone;

  useEffect(() => {
    const tz = deviceTimezone();
    if (!user || !current || !tz || tz === current) return;
    rhythmRepository
      .syncTimezone(user.id, tz)
      .then(() => queryClient.invalidateQueries({ queryKey: ["profile"] }))
      .catch(() => {});
  }, [user, current, queryClient]);
}
