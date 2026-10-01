import type { Tables } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";

export type Resource = Tables<"resources">;

export const resourcesRepository = {
  async list(): Promise<Resource[]> {
    const { data, error } = await requireSupabase()
      .from("resources")
      .select("*")
      .eq("is_published", true)
      .order("position")
      .limit(60);
    if (error) throw new AppError("unknown", "No pudimos cargar los recursos.", error);
    return data;
  },

  async ministryNews(userId: string): Promise<boolean> {
    const { data, error } = await requireSupabase().from("profiles").select("ministry_news").eq("id", userId).single();
    if (error) throw new AppError("unknown", "No pudimos cargar tu preferencia.", error);
    return data.ministry_news;
  },

  async setMinistryNews(userId: string, on: boolean) {
    const { error } = await requireSupabase().from("profiles").update({ ministry_news: on }).eq("id", userId);
    if (error) throw new AppError("unknown", "No pudimos guardar tu preferencia.", error);
  },
};
