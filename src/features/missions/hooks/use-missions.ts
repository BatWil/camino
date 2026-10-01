"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useCurrentChurch } from "@/features/churches/hooks/use-access";
import type { MissionProgram } from "@/lib/supabase/database.types";
import { missionsRepository } from "../data/missions.repository";

export function useCampaign(program: MissionProgram) {
  const { user } = useAuth();
  const { church } = useCurrentChurch();
  const queryClient = useQueryClient();
  const campaign = useQuery({
    queryKey: ["missions", program, church?.churchId],
    queryFn: () => missionsRepository.active(church!.churchId, program),
    enabled: Boolean(church),
  });
  const id = campaign.data?.id;
  const totals = useQuery({
    queryKey: ["missions", "totals", id],
    queryFn: () => missionsRepository.totals(id!),
    enabled: Boolean(id),
  });
  const mine = useQuery({
    queryKey: ["missions", "mine", id, user?.id],
    queryFn: () => missionsRepository.myOfferings(id!, user!.id),
    enabled: Boolean(id && user),
  });
  const record = useMutation({
    mutationFn: (amount: number) => missionsRepository.record(id!, amount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["missions"] }),
  });
  return { campaign, totals, mine, record };
}
