import type { JournalKind } from "@/lib/supabase/database.types";

export const KIND_META: Record<JournalKind, { label: string; color: string }> = {
  free: { label: "Libre", color: "rgba(244,242,236,.6)" },
  gratitude: { label: "Gratitud", color: "#35D07F" },
  struggle: { label: "Lucha", color: "#FF8A3D" },
  reflection: { label: "Reflexión", color: "#9B6BFF" },
  verse: { label: "Versículo", color: "#3D8BFF" },
  devotional: { label: "Devocional", color: "#FFC83D" },
};

/** Filter chips of screen 5d. */
export const FILTERS: ReadonlyArray<{ id: "all" | JournalKind; label: string }> = [
  { id: "all", label: "Todo" },
  { id: "gratitude", label: "Gratitud" },
  { id: "struggle", label: "Luchas" },
  { id: "verse", label: "Versículos" },
];

/** "Pregunta de hoy" — one per day, rotating. */
export const DAILY_PROMPTS = [
  "¿Dónde viste a Dios obrar esta semana?",
  "¿Qué te dio paz hoy?",
  "¿Por qué tres cosas puedes dar gracias hoy?",
  "¿Qué te está costando entregarle a Dios?",
  "¿A quién podrías animar esta semana?",
  "¿Qué versículo te acompañó hoy?",
  "¿Qué aprendiste de ti en estos días?",
  "¿Qué le dirías a Dios si nadie más te escuchara?",
  "¿Cuándo te sentiste cerca de Dios esta semana?",
  "¿Qué paso pequeño quieres dar mañana?",
];

export function promptFor(date: Date): string {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return DAILY_PROMPTS[day % DAILY_PROMPTS.length];
}

const DAYS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

/** "HOY", "AYER" or "DOM 27" (screen 5d eyebrows). */
export function dayLabel(isoDate: string, today: Date): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((t.getTime() - date.getTime()) / 86_400_000);
  if (diff === 0) return "HOY";
  if (diff === 1) return "AYER";
  return `${DAYS[date.getDay()]} ${d}`;
}

export function timeLabel(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}
