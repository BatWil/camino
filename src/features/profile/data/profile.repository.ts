import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";
import type { Profile } from "../domain/profile";

export const profileRepository = {
  async getOwn(userId: string): Promise<Profile | null> {
    const { data, error } = await requireSupabase().from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw new AppError("unknown", "No pudimos cargar tu perfil.", error);
    return data;
  },
};
