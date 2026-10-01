import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";

export interface ChurchPreview {
  name: string;
  city: string | null;
}

export interface JoinedChurch extends ChurchPreview {
  churchId: string;
}

export const churchRepository = {
  /** Public identity of the church behind a code (screen 4b card), or null. */
  async preview(code: string): Promise<ChurchPreview | null> {
    const { data, error } = await requireSupabase().rpc("preview_church_by_code", { p_code: code });
    if (error) throw new AppError("unknown", "No pudimos buscar ese código.", error);
    const row = data?.[0];
    return row ? { name: row.church_name, city: row.city } : null;
  },

  async join(code: string): Promise<JoinedChurch> {
    const { data, error } = await requireSupabase().rpc("join_church_by_code", { p_code: code });
    if (error) {
      if (error.code === "P0002" || error.code === "22023") {
        throw new AppError("not_found", "No encontramos una iglesia con ese código. Revísalo con tu líder.", error);
      }
      throw new AppError("unknown", "No pudimos unirte en este momento. Inténtalo de nuevo.", error);
    }
    const row = data?.[0];
    if (!row) throw new AppError("not_found", "No encontramos una iglesia con ese código.");
    return { churchId: row.church_id, name: row.church_name, city: row.city };
  },
};
