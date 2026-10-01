import type { Database, MissionProgram, Tables } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";

export type Campaign = Tables<"mission_campaigns">;
export type Totals = Database["public"]["Functions"]["campaign_totals"]["Returns"][number];
export type TreasuryRow = Database["public"]["Functions"]["treasury_offerings"]["Returns"][number];

export const missionsRepository = {
  async active(churchId: string, program: MissionProgram): Promise<Campaign | null> {
    const { data, error } = await requireSupabase()
      .from("mission_campaigns")
      .select("*")
      .eq("church_id", churchId)
      .eq("program", program)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new AppError("unknown", "No pudimos cargar la meta.", error);
    return data;
  },

  async all(churchId: string): Promise<Campaign[]> {
    const { data, error } = await requireSupabase()
      .from("mission_campaigns")
      .select("*")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false });
    if (error) throw new AppError("unknown", "No pudimos cargar las campañas.", error);
    return data;
  },

  async totals(campaignId: string): Promise<Totals> {
    const { data, error } = await requireSupabase().rpc("campaign_totals", { p_campaign_id: campaignId });
    if (error) throw new AppError("unknown", "No pudimos cargar el total.", error);
    const row = data[0];
    return { confirmed: Number(row?.confirmed ?? 0), recorded: Number(row?.recorded ?? 0), givers: row?.givers ?? 0 };
  },

  async myOfferings(campaignId: string, userId: string): Promise<Tables<"mission_offerings">[]> {
    const { data, error } = await requireSupabase()
      .from("mission_offerings")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new AppError("unknown", "No pudimos cargar tus ofrendas.", error);
    return data;
  },

  async record(campaignId: string, amount: number) {
    const { error } = await requireSupabase().from("mission_offerings").insert({ campaign_id: campaignId, amount });
    if (error) throw new AppError("unknown", "No pudimos registrar tu ofrenda.", error);
  },

  async create(input: Database["public"]["Tables"]["mission_campaigns"]["Insert"]) {
    const { error } = await requireSupabase().from("mission_campaigns").insert(input);
    if (error) throw new AppError("unknown", "No pudimos crear la meta.", error);
  },

  async setActive(id: string, active: boolean) {
    const { error } = await requireSupabase().from("mission_campaigns").update({ is_active: active }).eq("id", id);
    if (error) throw new AppError("unknown", "No pudimos actualizar la meta.", error);
  },

  async treasury(churchId: string): Promise<TreasuryRow[]> {
    const { data, error } = await requireSupabase().rpc("treasury_offerings", { p_church_id: churchId });
    if (error) throw new AppError("unauthorized", "Solo el pastor o el administrador confirman ofrendas.", error);
    return data;
  },

  async confirm(id: string, confirm: boolean) {
    const { error } = await requireSupabase().rpc("confirm_offering", { p_offering_id: id, p_confirm: confirm });
    if (error) throw new AppError("unknown", "No pudimos confirmar la ofrenda.", error);
  },
};
