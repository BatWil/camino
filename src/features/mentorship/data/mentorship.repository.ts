import type { Database, Tables } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";

type Fn<K extends keyof Database["public"]["Functions"]> = Database["public"]["Functions"][K]["Returns"];

export type MyMentor = Fn<"my_mentor">[number];
export type Mentee = Fn<"my_mentees">[number];
export type Message = Tables<"mentorship_messages">;
export type SharedCheckin = Pick<Tables<"check_ins">, "id" | "mood" | "week_start">;

export interface Conversation {
  id: string;
  mentorId: string;
  menteeId: string;
  status: Tables<"mentorships">["status"];
  churchId: string;
}

/**
 * Mentor ↔ youth conversation. Only exists inside a mentorship assigned by a
 * church leader; RLS lets the two participants (and the church's pastor, for
 * safeguarding) read it. Messages are immutable.
 */
export const mentorshipRepository = {
  async myMentor(): Promise<MyMentor | null> {
    const { data, error } = await requireSupabase().rpc("my_mentor");
    if (error) throw new AppError("unknown", "No pudimos cargar a tu mentor.", error);
    return data[0] ?? null;
  },

  async myMentees(): Promise<Mentee[]> {
    const { data, error } = await requireSupabase().rpc("my_mentees");
    if (error) throw new AppError("unknown", "No pudimos cargar a tus jóvenes.", error);
    return data;
  },

  async conversation(id: string): Promise<Conversation | null> {
    const { data, error } = await requireSupabase()
      .from("mentorships")
      .select("id, mentor_id, mentee_id, status, church_id")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new AppError("unknown", "No pudimos cargar la conversación.", error);
    return data
      ? {
          id: data.id,
          mentorId: data.mentor_id,
          menteeId: data.mentee_id,
          status: data.status,
          churchId: data.church_id,
        }
      : null;
  },

  async messages(mentorshipId: string): Promise<Message[]> {
    const { data, error } = await requireSupabase()
      .from("mentorship_messages")
      .select("*")
      .eq("mentorship_id", mentorshipId)
      .order("created_at", { ascending: true })
      .limit(300);
    if (error) throw new AppError("unknown", "No pudimos cargar los mensajes.", error);
    return data;
  },

  /** Shared check-ins: week + mood only, never the note (security-definer RPC). */
  async sharedCheckins(mentorshipId: string): Promise<SharedCheckin[]> {
    const { data, error } = await requireSupabase().rpc("shared_checkins", { p_mentorship_id: mentorshipId });
    if (error) throw new AppError("unknown", "No pudimos cargar el check-in.", error);
    return data;
  },

  async send(mentorshipId: string, body: string) {
    const { error } = await requireSupabase()
      .from("mentorship_messages")
      .insert({ mentorship_id: mentorshipId, kind: "text", body });
    if (error) throw new AppError("unknown", "No pudimos enviar tu mensaje.", error);
  },

  async proposeMeeting(mentorshipId: string, at: string, place: string | null) {
    const { error } = await requireSupabase().from("mentorship_messages").insert({
      mentorship_id: mentorshipId,
      kind: "meeting",
      meeting_at: at,
      meeting_place: place,
      meeting_status: "proposed",
    });
    if (error) throw new AppError("unknown", "No pudimos proponer la reunión.", error);
  },

  async respondMeeting(messageId: string, accept: boolean) {
    const { error } = await requireSupabase().rpc("respond_meeting", { p_message_id: messageId, p_accept: accept });
    if (error) throw new AppError("unknown", "No pudimos responder.", error);
  },

  async shareCheckin(checkInId: string) {
    const { error } = await requireSupabase().rpc("share_checkin_with_mentor", { p_check_in_id: checkInId });
    if (error) throw new AppError("unknown", "No pudimos compartir tu check-in.", error);
  },

  async report(input: { churchId: string; mentorshipId: string | null; messageId?: string | null; reason: string }) {
    const { error } = await requireSupabase()
      .from("safety_reports")
      .insert({
        church_id: input.churchId,
        mentorship_id: input.mentorshipId,
        message_id: input.messageId ?? null,
        reason: input.reason,
      });
    if (error) throw new AppError("unknown", "No pudimos enviar tu reporte.", error);
  },

  async end(mentorshipId: string, reason: string | null) {
    const { error } = await requireSupabase().rpc("end_mentorship", {
      p_mentorship_id: mentorshipId,
      p_reason: reason,
    });
    if (error) throw new AppError("unknown", "No pudimos terminar la mentoría.", error);
  },
};
