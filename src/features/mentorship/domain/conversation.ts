const DAY_MS = 86_400_000;

function localDay(d: Date): number {
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60_000) / DAY_MS);
}

/** "HOY", "AYER", weekday within the last week ("MARTES"), otherwise "12 SEP". */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const diff = localDay(now) - localDay(d);
  if (diff <= 0) return "HOY";
  if (diff === 1) return "AYER";
  if (diff < 7) return new Intl.DateTimeFormat("es", { weekday: "long" }).format(d).toUpperCase();
  return new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(d).replace(".", "").toUpperCase();
}

/** Groups consecutive messages under a day separator. */
export function groupByDay<T extends { created_at: string }>(
  items: readonly T[],
  now: Date = new Date(),
): Array<{ label: string; items: T[] }> {
  const out: Array<{ label: string; items: T[] }> = [];
  for (const item of items) {
    const label = dayLabel(item.created_at, now);
    const last = out[out.length - 1];
    if (last && last.label === label) last.items.push(item);
    else out.push({ label, items: [item] });
  }
  return out;
}

/** "Jueves · 6:00 PM · Café Nube" (design 7b). */
export function meetingLabel(atIso: string, place: string | null): string {
  const d = new Date(atIso);
  const day = new Intl.DateTimeFormat("es", { weekday: "long" }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(d);
  return [day.charAt(0).toUpperCase() + day.slice(1), time, place?.trim() || null].filter(Boolean).join(" · ");
}

/**
 * Approximate activity (never exact counts of private actions):
 * "● Activo esta semana" / "○ Hace 9 días" / "○ Sin actividad aún".
 */
export function activityLabel(lastActive: string | null, today: Date = new Date()): { active: boolean; text: string } {
  if (!lastActive) return { active: false, text: "Sin actividad aún" };
  const days = localDay(today) - localDay(new Date(`${lastActive}T12:00:00`));
  if (days < 7) return { active: true, text: "Activo esta semana" };
  return { active: false, text: `Hace ${days} días` };
}

/** Safeguarding: a message body sent to a mentor is trimmed and bounded. */
export function cleanMessage(body: string): string | null {
  const t = body.replace(/\s+\n/g, "\n").trim();
  if (!t) return null;
  return t.slice(0, 2000);
}
