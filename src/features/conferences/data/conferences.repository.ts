import type { Tables } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";

export type Conference = Tables<"conferences">;
export type Session = Tables<"conference_sessions">;

export const conferencesRepository = {
  /** Next published conference visible to the caller (platform or their church). */
  async featured(): Promise<Conference | null> {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await requireSupabase()
      .from("conferences")
      .select("*")
      .eq("is_published", true)
      .gte("ends_on", today)
      .order("starts_on", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw new AppError("unknown", "No pudimos cargar la conferencia.", error);
    return data;
  },

  async get(id: string): Promise<Conference | null> {
    const { data, error } = await requireSupabase().from("conferences").select("*").eq("id", id).maybeSingle();
    if (error) throw new AppError("unknown", "No pudimos cargar la conferencia.", error);
    return data;
  },

  async sessions(conferenceId: string): Promise<Session[]> {
    const { data, error } = await requireSupabase()
      .from("conference_sessions")
      .select("*")
      .eq("conference_id", conferenceId)
      .order("day")
      .order("starts_at");
    if (error) throw new AppError("unknown", "No pudimos cargar la agenda.", error);
    return data;
  },

  async myRegistration(conferenceId: string, userId: string): Promise<{ badge_code: string } | null> {
    const { data, error } = await requireSupabase()
      .from("conference_registrations")
      .select("badge_code")
      .eq("conference_id", conferenceId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new AppError("unknown", "No pudimos cargar tu registro.", error);
    return data;
  },

  async register(conferenceId: string, register: boolean) {
    const { error } = await requireSupabase().rpc("register_for_conference", {
      p_conference_id: conferenceId,
      p_register: register,
    });
    if (error) throw new AppError("unknown", "No pudimos completar tu registro.", error);
  },

  async churchCount(conferenceId: string, churchId: string): Promise<number> {
    const { data, error } = await requireSupabase().rpc("conference_church_count", {
      p_conference_id: conferenceId,
      p_church_id: churchId,
    });
    if (error) throw new AppError("unknown", "No pudimos cargar tu iglesia.", error);
    return data;
  },

  async myAgenda(userId: string): Promise<string[]> {
    const { data, error } = await requireSupabase()
      .from("conference_agenda_items")
      .select("session_id")
      .eq("user_id", userId);
    if (error) throw new AppError("unknown", "No pudimos cargar tu agenda.", error);
    return data.map((d) => d.session_id);
  },

  async toggleAgenda(sessionId: string, on: boolean) {
    const sb = requireSupabase();
    const { error } = on
      ? await sb.from("conference_agenda_items").insert({ session_id: sessionId })
      : await sb.from("conference_agenda_items").delete().eq("session_id", sessionId);
    if (error && error.code !== "23505") throw new AppError("unknown", "No pudimos actualizar tu agenda.", error);
  },
};
