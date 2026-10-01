import type { PrayerCategory, PrayerPrivacy } from "@/lib/supabase/database.types";

export const CATEGORY_LABEL: Record<PrayerCategory, string> = {
  family: "Familia",
  studies: "Estudios",
  health: "Salud",
  friends: "Amigos",
  church: "Iglesia",
  work: "Trabajo",
  faith: "Fe",
  other: "Otro",
};

export const PRIVACY_LABEL: Record<PrayerPrivacy, string> = {
  PRIVATE: "Solo yo",
  MENTOR: "Mi mentor",
  GROUP: "Mi grupo",
  CHURCH: "Mi iglesia",
};

/** Whole days between two instants (≥ 0). */
export function daysBetween(fromIso: string, to: Date = new Date()): number {
  return Math.max(0, Math.floor((to.getTime() - new Date(fromIso).getTime()) / 86_400_000));
}

export function daysLabel(n: number): string {
  if (n === 0) return "Hoy";
  return `${n} ${n === 1 ? "día" : "días"}`;
}

/** "✦ Dios respondió después de 12 días ✦" (screen 2f). */
export function answeredLabel(createdIso: string, answeredIso: string): string {
  const n = daysBetween(createdIso, new Date(answeredIso));
  return n === 0 ? "✦ Dios respondió hoy ✦" : `✦ Dios respondió después de ${daysLabel(n)} ✦`;
}

/**
 * "Modo oración" guide (screen 2g): five movements. With a fixed duration the time
 * is split evenly; "Libre" lets the person advance at their own pace.
 */
export const GUIDE = [
  { title: "Adoración", prompt: "Dile a Dios quién es para ti. Sin prisa." },
  { title: "Agradecimiento", prompt: "Dale gracias por tres cosas de hoy. Pequeñas también cuentan." },
  { title: "Perdón", prompt: "Cuéntale con honestidad en qué fallaste. Su gracia es más grande." },
  { title: "Peticiones", prompt: "Preséntale lo que necesitas. Él cuida de ti." },
  { title: "Intercesión", prompt: "Ora por alguien más: tu familia, un amigo, tu iglesia." },
] as const;

export const DURATIONS = [
  { id: "5", label: "5 min", seconds: 300 },
  { id: "10", label: "10 min", seconds: 600 },
  { id: "15", label: "15 min", seconds: 900 },
  { id: "libre", label: "Libre", seconds: null },
] as const;

export function stepForElapsed(elapsed: number, total: number | null, manualStep: number): number {
  if (total === null) return manualStep;
  const per = total / GUIDE.length;
  return Math.min(GUIDE.length - 1, Math.max(manualStep, Math.floor(elapsed / per)));
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
