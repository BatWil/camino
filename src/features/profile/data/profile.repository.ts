import type { Expectation, GrowthArea } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";
import type { Profile } from "../domain/profile";

export const profileRepository = {
  async getOwn(userId: string): Promise<Profile | null> {
    const { data, error } = await requireSupabase().from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw new AppError("unknown", "No pudimos cargar tu perfil.", error);
    return data;
  },

  async updatePreferences(userId: string, prefs: { growthAreas: GrowthArea[]; expectations: Expectation[] }) {
    const { error } = await requireSupabase()
      .from("profiles")
      .update({ growth_areas: prefs.growthAreas, expectations: prefs.expectations })
      .eq("id", userId);
    if (error) throw new AppError("unknown", "No pudimos guardar tus cambios.", error);
  },
};
