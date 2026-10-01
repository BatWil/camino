import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";

const BUCKET = "avatars";

/** Avatars live in a private bucket at {userId}/avatar.(webp|jpg); RLS limits access to the owner. */
export const avatarRepository = {
  async upload(userId: string, image: Blob): Promise<string> {
    const ext = image.type === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/avatar.${ext}`;
    const sb = requireSupabase();
    const { error } = await sb.storage.from(BUCKET).upload(path, image, {
      upsert: true,
      contentType: image.type,
      cacheControl: "3600",
    });
    if (error) throw new AppError("unknown", "No pudimos subir tu foto. Inténtalo de nuevo.", error);
    const { error: profileError } = await sb.from("profiles").update({ avatar_path: path }).eq("id", userId);
    if (profileError) throw new AppError("unknown", "No pudimos guardar tu foto.", profileError);
    return path;
  },

  async signedUrl(path: string): Promise<string> {
    const { data, error } = await requireSupabase()
      .storage.from(BUCKET)
      .createSignedUrl(path, 60 * 60);
    if (error || !data) throw new AppError("unknown", "No pudimos cargar tu foto.", error);
    return data.signedUrl;
  },
};
