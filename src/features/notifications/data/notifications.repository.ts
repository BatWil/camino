import type { DevicePlatform, Tables } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";

export type Notice = Tables<"notifications">;
export type NoticePrefs = Tables<"notification_preferences">;

export const DEFAULT_PREFS: Omit<NoticePrefs, "user_id" | "updated_at"> = {
  push_enabled: false,
  community: true,
  daily_reminder: false,
  reminder_time: "19:00:00",
  quiet_start: "21:30:00",
  quiet_end: "08:00:00",
};

/** In-app notices. RLS: only the owner reads them; rows are created by database triggers. */
export const notificationsRepository = {
  async list(userId: string): Promise<Notice[]> {
    const { data, error } = await requireSupabase()
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw new AppError("unknown", "No pudimos cargar tus avisos.", error);
    return data;
  },

  async unread(userId: string): Promise<number> {
    const { count, error } = await requireSupabase()
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null);
    if (error) throw new AppError("unknown", "No pudimos cargar tus avisos.", error);
    return count ?? 0;
  },

  async markAllRead() {
    const { error } = await requireSupabase().rpc("mark_notifications_read");
    if (error) throw new AppError("unknown", "No pudimos actualizar tus avisos.", error);
  },

  async remove(id: string) {
    const { error } = await requireSupabase().from("notifications").delete().eq("id", id);
    if (error) throw new AppError("unknown", "No pudimos borrar el aviso.", error);
  },

  async prefs(userId: string): Promise<NoticePrefs | null> {
    const { data, error } = await requireSupabase()
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new AppError("unknown", "No pudimos cargar tus preferencias.", error);
    return data;
  },

  async savePrefs(patch: Partial<Omit<NoticePrefs, "user_id" | "updated_at">>) {
    const { error } = await requireSupabase().from("notification_preferences").upsert(patch, { onConflict: "user_id" });
    if (error) throw new AppError("unknown", "No pudimos guardar tus preferencias.", error);
  },

  async registerDevice(token: string, platform: DevicePlatform) {
    const { error } = await requireSupabase().rpc("register_device", { p_token: token, p_platform: platform });
    if (error) throw new AppError("unknown", "No pudimos activar los avisos en este teléfono.", error);
  },

  async forgetDevice(token: string) {
    const { error } = await requireSupabase().from("device_tokens").delete().eq("token", token);
    if (error) throw new AppError("unknown", "No pudimos desactivar este teléfono.", error);
  },
};
