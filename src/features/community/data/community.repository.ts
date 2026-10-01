import type { Database, Tables } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";

type Fn<K extends keyof Database["public"]["Functions"]> = Database["public"]["Functions"][K]["Returns"];

export type Series = Tables<"series">;
export type SharedPrayer = Fn<"shared_prayers">[number];
export type RosterMember = Fn<"group_roster">[number];
export type PlanInvite = Fn<"my_plan_invites">[number];
export type PlanCompanion = Fn<"plan_companions_of">[number];

export interface GroupSummary {
  id: string;
  name: string;
  meetingSchedule: string | null;
}

/** Church hub (screen 2h). Everything is scoped by RLS to the caller's church and groups. */
export const communityRepository = {
  async activeSeries(churchId: string): Promise<Series | null> {
    const { data, error } = await requireSupabase()
      .from("series")
      .select("*")
      .eq("church_id", churchId)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new AppError("unknown", "No pudimos cargar la serie.", error);
    return data;
  },

  async myGroup(userId: string, churchId: string): Promise<GroupSummary | null> {
    const sb = requireSupabase();
    const { data: memberships, error } = await sb.from("group_members").select("group_id").eq("user_id", userId);
    if (error) throw new AppError("unknown", "No pudimos cargar tu grupo.", error);
    if (!memberships.length) return null;
    const { data: groups, error: gErr } = await sb
      .from("groups")
      .select("id, name, meeting_schedule")
      .in(
        "id",
        memberships.map((m) => m.group_id),
      )
      .eq("church_id", churchId)
      .limit(1);
    if (gErr) throw new AppError("unknown", "No pudimos cargar tu grupo.", gErr);
    const g = groups[0];
    return g ? { id: g.id, name: g.name, meetingSchedule: g.meeting_schedule } : null;
  },

  async roster(groupId: string): Promise<RosterMember[]> {
    const { data, error } = await requireSupabase().rpc("group_roster", { p_group_id: groupId });
    if (error) throw new AppError("unknown", "No pudimos cargar tu grupo.", error);
    return data;
  },

  async sharedPrayers(churchId: string): Promise<SharedPrayer[]> {
    const { data, error } = await requireSupabase().rpc("shared_prayers", { p_church_id: churchId });
    if (error) throw new AppError("unknown", "No pudimos cargar las peticiones.", error);
    return data;
  },

  async pray(prayerId: string) {
    const { error } = await requireSupabase().from("prayer_intercessions").insert({ prayer_id: prayerId });
    // Already prayed today → unique violation; treat as success.
    if (error && error.code !== "23505") throw new AppError("unknown", "No pudimos registrar tu oración.", error);
  },

  async requestConversation(churchId: string, withRole: "mentor" | "pastor" | "leader", topic: string | null) {
    const { error } = await requireSupabase()
      .from("conversation_requests")
      .insert({ church_id: churchId, with_role: withRole, topic });
    if (error) throw new AppError("unknown", "No pudimos enviar tu solicitud.", error);
  },

  async openConversationRequest(userId: string): Promise<boolean> {
    const { count, error } = await requireSupabase()
      .from("conversation_requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "open");
    if (error) throw new AppError("unknown", "No pudimos cargar tus solicitudes.", error);
    return (count ?? 0) > 0;
  },

  /** "Hacerlo con un amigo": only people who share a group with the caller can be invited. */
  async invitePlanCompanion(userPlanId: string, companionId: string) {
    const { error } = await requireSupabase().rpc("invite_plan_companion", {
      p_user_plan_id: userPlanId,
      p_companion: companionId,
    });
    if (error) throw new AppError("unknown", "No pudimos enviar la invitación.", error);
  },

  async planCompanions(userPlanId: string): Promise<PlanCompanion[]> {
    const { data, error } = await requireSupabase().rpc("plan_companions_of", { p_user_plan_id: userPlanId });
    if (error) throw new AppError("unknown", "No pudimos cargar a tus compañeros.", error);
    return data;
  },

  async planInvites(): Promise<PlanInvite[]> {
    const { data, error } = await requireSupabase().rpc("my_plan_invites");
    if (error) throw new AppError("unknown", "No pudimos cargar tus invitaciones.", error);
    return data;
  },

  async respondPlanInvite(inviteId: string, accept: boolean): Promise<string | null> {
    const { data, error } = await requireSupabase().rpc("respond_plan_invite", {
      p_invite_id: inviteId,
      p_accept: accept,
    });
    if (error) throw new AppError("unknown", "No pudimos responder la invitación.", error);
    return data;
  },
};
