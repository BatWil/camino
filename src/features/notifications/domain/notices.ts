import type { NotificationKind } from "@/lib/supabase/database.types";

/** Visual language of screen 7e: content → rounded square, people → circle; answers are highlighted in lime. */
export const NOTICE_STYLE: Record<
  NotificationKind,
  { color: string; shape: "square" | "circle"; highlight?: boolean }
> = {
  mentor_message: { color: "#3D8BFF", shape: "circle" },
  mentorship: { color: "#3D8BFF", shape: "circle" },
  question_answered: { color: "#0D0A26", shape: "circle", highlight: true },
  new_question: { color: "#FFC83D", shape: "circle" },
  conversation_request: { color: "#FF6B4A", shape: "circle" },
  event_published: { color: "#FF8A3D", shape: "square" },
  plan_invite: { color: "#9B6BFF", shape: "circle" },
  fine_arts_reviewed: { color: "#9B6BFF", shape: "square" },
  offering_confirmed: { color: "#FF8A3D", shape: "square" },
  service_decided: { color: "#35D07F", shape: "square" },
  other: { color: "#FFC83D", shape: "square" },
};

export type NoticeGroup = "HOY" | "ESTA SEMANA" | "ANTES";

function dayIndex(d: Date): number {
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60_000) / 86_400_000);
}

export function groupNotices<T extends { created_at: string }>(items: readonly T[], now: Date = new Date()) {
  const today = dayIndex(now);
  const groups: Array<{ label: NoticeGroup; items: T[] }> = [];
  for (const item of items) {
    const diff = today - dayIndex(new Date(item.created_at));
    const label: NoticeGroup = diff <= 0 ? "HOY" : diff < 7 ? "ESTA SEMANA" : "ANTES";
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}

export { isSafeInternalPath } from "@/lib/deep-links";

/** Gentle local reminders (7e copy). Never guilt, never streak pressure. */
export const REMINDERS = {
  daily: { id: 1001, title: "Tu devocional te espera", body: "5 minutos para empezar con calma.", href: "/inicio" },
  comeBack: {
    id: 1002,
    title: "Te extrañamos, sin presión",
    body: "Cuando quieras, retomas donde lo dejaste.",
    href: "/inicio",
  },
} as const;

/** Days away before the single "te extrañamos" reminder fires. It is re-armed on every app open. */
export const COME_BACK_AFTER_DAYS = 7;

/** "19:00:00" → { hour: 19, minute: 0 }. */
export function parseTime(t: string): { hour: number; minute: number } {
  const [h, m] = t.split(":").map(Number);
  return { hour: Math.min(23, Math.max(0, h || 0)), minute: Math.min(59, Math.max(0, m || 0)) };
}

/** Next date at `time`, `days` days from `now` (local). */
export function comeBackDate(now: Date, time: string, days = COME_BACK_AFTER_DAYS): Date {
  const { hour, minute } = parseTime(time);
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}
