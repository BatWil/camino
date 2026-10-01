import type { Database } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";
import { parseOverview, type LeaderOverview } from "../domain/leader";

type Fn<K extends keyof Database["public"]["Functions"]> = Database["public"]["Functions"][K]["Returns"];
export type YouthRow = Fn<"leader_youth">[number];
export type ConversationRequestRow = Fn<"leader_conversation_requests">[number];

/** Leader panel: accompaniment data only, served by security-definer RPCs that check the role. */
export const leaderRepository = {
  async overview(churchId: string): Promise<LeaderOverview> {
    const { data, error } = await requireSupabase().rpc("leader_overview", { p_church_id: churchId });
    if (error) throw new AppError("unknown", "No pudimos cargar el resumen.", error);
    return parseOverview(data);
  },

  async youth(churchId: string): Promise<YouthRow[]> {
    const { data, error } = await requireSupabase().rpc("leader_youth", { p_church_id: churchId });
    if (error) throw new AppError("unknown", "No pudimos cargar a los jóvenes.", error);
    return data;
  },

  async requests(churchId: string): Promise<ConversationRequestRow[]> {
    const { data, error } = await requireSupabase().rpc("leader_conversation_requests", { p_church_id: churchId });
    if (error) throw new AppError("unknown", "No pudimos cargar las solicitudes.", error);
    return data;
  },

  async setRequestStatus(id: string, status: "scheduled" | "closed") {
    const { error } = await requireSupabase().from("conversation_requests").update({ status }).eq("id", id);
    if (error) throw new AppError("unknown", "No pudimos actualizar la solicitud.", error);
  },

  async assignMentor(churchId: string, mentorId: string, menteeId: string) {
    const { error } = await requireSupabase().rpc("assign_mentor", {
      p_church_id: churchId,
      p_mentor: mentorId,
      p_mentee: menteeId,
    });
    if (error) throw new AppError("unknown", "No pudimos asignar al mentor.", error);
  },
};
