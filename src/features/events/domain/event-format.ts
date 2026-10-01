const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

function parts(iso: string, timeZone?: string) {
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const [y, m, day] = fmt.format(d).split("-").map(Number);
  return { y, m, day };
}

/** "24–26 OCT", "30 OCT – 2 NOV", "2 NOV" (design 2h/7d). */
export function formatEventDates(startsAt: string, endsAt: string | null, timeZone?: string): string {
  const s = parts(startsAt, timeZone);
  if (!endsAt) return `${s.day} ${MONTHS[s.m - 1]}`;
  const e = parts(endsAt, timeZone);
  if (s.y === e.y && s.m === e.m) {
    return s.day === e.day ? `${s.day} ${MONTHS[s.m - 1]}` : `${s.day}–${e.day} ${MONTHS[s.m - 1]}`;
  }
  return `${s.day} ${MONTHS[s.m - 1]} – ${e.day} ${MONTHS[e.m - 1]}`;
}

export function formatEventTime(startsAt: string, timeZone?: string): string {
  return new Intl.DateTimeFormat("es", { timeZone, weekday: "long", hour: "numeric", minute: "2-digit" }).format(
    new Date(startsAt),
  );
}

/**
 * Privacy-aware attendance line. The design shows names ("Sofía, Mateo y 38 más van");
 * we never expose who registered to other youth, so only counts are shown.
 */
export function attendanceLabel(count: number, registered: boolean): string {
  if (count <= 0) return "Sé de los primeros en ir";
  if (registered) {
    const others = count - 1;
    if (others <= 0) return "Vas tú · invita a alguien";
    return `Tú y ${others} ${others === 1 ? "persona más van" : "más van"}`;
  }
  return count === 1 ? "1 persona va" : `${count} personas van`;
}

/** Public link for sharing (opens the app through the deep-link handler, or the web route). */
export function eventShareUrl(appUrl: string, eventId: string): string {
  return `${appUrl.replace(/\/$/, "")}/evento/?id=${encodeURIComponent(eventId)}`;
}
