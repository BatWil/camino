"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { journeyRepository } from "../data/journey.repository";

export function useJourneyStages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["journey", "stages"],
    queryFn: () => journeyRepository.listStages(),
    enabled: Boolean(user),
    // Reference data: changes rarely.
    staleTime: 24 * 60 * 60_000,
  });
}
