import type { Database, GiftArea, Json, Tables } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";

type Fn<K extends keyof Database["public"]["Functions"]> = Database["public"]["Functions"][K]["Returns"];

export type Opportunity = Tables<"service_opportunities">;
export type ServiceRequest = Pick<Tables<"service_requests">, "id" | "opportunity_id" | "status">;
export type GiftAssessment = Tables<"gift_assessments">;
export type LeaderServiceRequest = Fn<"leader_service_requests">[number];

export const serviceRepository = {
  async opportunities(churchId: string): Promise<Opportunity[]> {
    const { data, error } = await requireSupabase()
      .from("service_opportunities")
      .select("*")
      .eq("church_id", churchId)
      .eq("is_open", true)
      .order("created_at", { ascending: true });
    if (error) throw new AppError("unknown", "No pudimos cargar dónde servir.", error);
    return data;
  },

  async allOpportunities(churchId: string): Promise<Opportunity[]> {
    const { data, error } = await requireSupabase()
      .from("service_opportunities")
      .select("*")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false });
    if (error) throw new AppError("unknown", "No pudimos cargar las oportunidades.", error);
    return data;
  },

  async myRequests(userId: string): Promise<ServiceRequest[]> {
    const { data, error } = await requireSupabase()
      .from("service_requests")
      .select("id, opportunity_id, status")
      .eq("user_id", userId);
    if (error) throw new AppError("unknown", "No pudimos cargar tus solicitudes.", error);
    return data;
  },

  async interested(opportunityId: string) {
    const { error } = await requireSupabase().from("service_requests").insert({ opportunity_id: opportunityId });
    if (error && error.code !== "23505") throw new AppError("unknown", "No pudimos enviar tu interés.", error);
  },

  async withdraw(requestId: string) {
    const { error } = await requireSupabase().from("service_requests").delete().eq("id", requestId);
    if (error) throw new AppError("unknown", "No pudimos retirar tu solicitud.", error);
  },

  async myGifts(userId: string): Promise<GiftAssessment | null> {
    const { data, error } = await requireSupabase()
      .from("gift_assessments")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new AppError("unknown", "No pudimos cargar tus dones.", error);
    return data;
  },

  async saveGifts(answers: Record<string, number>, scores: Partial<Record<GiftArea, number>>) {
    const { error } = await requireSupabase()
      .from("gift_assessments")
      .upsert({ answers: answers as Json, scores: scores as Json, completed_at: new Date().toISOString() });
    if (error) throw new AppError("unknown", "No pudimos guardar tus resultados.", error);
  },

  async leaderRequests(churchId: string): Promise<LeaderServiceRequest[]> {
    const { data, error } = await requireSupabase().rpc("leader_service_requests", { p_church_id: churchId });
    if (error) throw new AppError("unknown", "No pudimos cargar las solicitudes.", error);
    return data;
  },

  async decide(requestId: string, accept: boolean) {
    const { error } = await requireSupabase().rpc("decide_service_request", {
      p_request_id: requestId,
      p_accept: accept,
    });
    if (error) throw new AppError("unknown", "No pudimos guardar la decisión.", error);
  },

  async createOpportunity(input: Database["public"]["Tables"]["service_opportunities"]["Insert"]) {
    const { error } = await requireSupabase().from("service_opportunities").insert(input);
    if (error) throw new AppError("unknown", "No pudimos crear la oportunidad.", error);
  },

  async setOpportunityOpen(id: string, isOpen: boolean) {
    const { error } = await requireSupabase().from("service_opportunities").update({ is_open: isOpen }).eq("id", id);
    if (error) throw new AppError("unknown", "No pudimos actualizar la oportunidad.", error);
  },
};
