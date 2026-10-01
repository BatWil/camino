import type { Database, Tables } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";

export type ChurchEvent = Tables<"events">;
export type EventInput = Database["public"]["Tables"]["events"]["Insert"];
export type Registration = Pick<Tables<"event_registrations">, "event_id" | "status" | "ticket_code">;

/** Events of the caller's church. Attendee names are never exposed to other youth (count only). */
export const eventsRepository = {
  async upcoming(churchId: string, limit = 20): Promise<ChurchEvent[]> {
    const since = new Date(Date.now() - 12 * 3600_000).toISOString();
    const { data, error } = await requireSupabase()
      .from("events")
      .select("*")
      .eq("church_id", churchId)
      .eq("is_published", true)
      .gte("starts_at", since)
      .order("starts_at", { ascending: true })
      .limit(limit);
    if (error) throw new AppError("unknown", "No pudimos cargar los eventos.", error);
    return data;
  },

  async all(churchId: string): Promise<ChurchEvent[]> {
    const { data, error } = await requireSupabase()
      .from("events")
      .select("*")
      .eq("church_id", churchId)
      .order("starts_at", { ascending: false })
      .limit(100);
    if (error) throw new AppError("unknown", "No pudimos cargar los eventos.", error);
    return data;
  },

  async get(id: string): Promise<ChurchEvent | null> {
    const { data, error } = await requireSupabase().from("events").select("*").eq("id", id).maybeSingle();
    if (error) throw new AppError("unknown", "No pudimos cargar el evento.", error);
    return data;
  },

  async myRegistrations(userId: string): Promise<Registration[]> {
    const { data, error } = await requireSupabase()
      .from("event_registrations")
      .select("event_id, status, ticket_code")
      .eq("user_id", userId);
    if (error) throw new AppError("unknown", "No pudimos cargar tus inscripciones.", error);
    return data;
  },

  async attendance(eventId: string): Promise<number> {
    const { data, error } = await requireSupabase().rpc("event_attendance", { p_event_id: eventId });
    if (error) throw new AppError("unknown", "No pudimos cargar los asistentes.", error);
    return data;
  },

  async register(eventId: string, register: boolean) {
    const { error } = await requireSupabase().rpc("register_for_event", {
      p_event_id: eventId,
      p_register: register,
    });
    if (error) {
      if (error.hint === "full") throw new AppError("invalid_input", "El evento ya está lleno.", error);
      if (error.code === "22023") throw new AppError("invalid_input", "Las inscripciones están cerradas.", error);
      throw new AppError("unknown", "No pudimos completar tu inscripción.", error);
    }
  },

  async create(input: EventInput) {
    const { error } = await requireSupabase().from("events").insert(input);
    if (error) throw new AppError("unknown", "No pudimos crear el evento.", error);
  },

  async update(id: string, patch: Database["public"]["Tables"]["events"]["Update"]) {
    const { error } = await requireSupabase().from("events").update(patch).eq("id", id);
    if (error) throw new AppError("unknown", "No pudimos guardar el evento.", error);
  },

  async registrationsCount(eventIds: string[]): Promise<Record<string, number>> {
    if (!eventIds.length) return {};
    const { data, error } = await requireSupabase()
      .from("event_registrations")
      .select("event_id")
      .in("event_id", eventIds)
      .neq("status", "cancelled");
    if (error) throw new AppError("unknown", "No pudimos cargar las inscripciones.", error);
    const counts: Record<string, number> = {};
    for (const r of data) counts[r.event_id] = (counts[r.event_id] ?? 0) + 1;
    return counts;
  },
};
