import type { FineArtsCategory, FineArtsStatus } from "@/lib/supabase/database.types";

/** Categories of screen 8d, in order. */
export const FINE_ARTS_CATEGORIES: ReadonlyArray<{ id: FineArtsCategory; label: string }> = [
  { id: "solo_vocal", label: "Canto solista" },
  { id: "band", label: "Banda" },
  { id: "drama", label: "Drama" },
  { id: "dance", label: "Danza" },
  { id: "visual_art", label: "Arte visual" },
  { id: "writing", label: "Escritura" },
];

export function categoryLabel(c: FineArtsCategory): string {
  return FINE_ARTS_CATEGORIES.find((x) => x.id === c)?.label ?? c;
}

/** Must match the bucket configuration in the M5 migration. */
export const FINE_ARTS_MIME = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;
export const FINE_ARTS_MAX_BYTES = 50 * 1024 * 1024;

export function validateUpload(file: { type: string; size: number }): string | null {
  if (!(FINE_ARTS_MIME as readonly string[]).includes(file.type)) {
    return "Formato no permitido. Usa video (MP4/MOV/WebM), audio (MP3/M4A), imagen (JPG/PNG/WebP) o PDF.";
  }
  if (file.size > FINE_ARTS_MAX_BYTES) return "El archivo pesa más de 50 MB.";
  if (file.size === 0) return "El archivo está vacío.";
  return null;
}

/** Safe storage key: `<uid>/<uuid>.<ext>` — never the original filename. */
export function storageKey(userId: string, mime: string, id: string): string {
  const ext: Record<string, string> = {
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
  };
  return `${userId}/${id}.${ext[mime] ?? "bin"}`;
}

export const STATUS_LABEL: Record<FineArtsStatus, string> = {
  draft: "Borrador",
  submitted: "En revisión",
  approved: "Aprobada ✓",
  returned: "Necesita cambios",
};

/** "cierre de inscripción: 15 may". */
export function deadlineLabel(iso: string | null): string | null {
  if (!iso) return null;
  const [, m, d] = iso.split("-").map(Number);
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `cierre de inscripción: ${d} ${months[m - 1]}`;
}
