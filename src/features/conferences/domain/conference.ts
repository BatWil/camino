import type { SessionKind } from "@/lib/supabase/database.types";

const MONTHS_LONG = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
const MONTHS_SHORT = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const DOW = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

function parse(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return { y, m, day };
}

/** "27–31 julio" (8b) or "30 julio – 2 agosto". */
export function conferenceDates(startsOn: string, endsOn: string): string {
  const s = parse(startsOn);
  const e = parse(endsOn);
  if (s.m === e.m && s.y === e.y) {
    return s.day === e.day ? `${s.day} ${MONTHS_LONG[s.m - 1]}` : `${s.day}–${e.day} ${MONTHS_LONG[s.m - 1]}`;
  }
  return `${s.day} ${MONTHS_LONG[s.m - 1]} – ${e.day} ${MONTHS_LONG[e.m - 1]}`;
}

/** "27–31 JUL" for the hub eyebrow. */
export function conferenceDatesShort(startsOn: string, endsOn: string): string {
  const s = parse(startsOn);
  const e = parse(endsOn);
  if (s.m === e.m) return `${s.day}–${e.day} ${MONTHS_SHORT[s.m - 1]}`;
  return `${s.day} ${MONTHS_SHORT[s.m - 1]} – ${e.day} ${MONTHS_SHORT[e.m - 1]}`;
}

/** Every day of the conference (8c day tabs). */
export function conferenceDays(startsOn: string, endsOn: string): Array<{ iso: string; dow: string; n: number }> {
  const out: Array<{ iso: string; dow: string; n: number }> = [];
  const s = parse(startsOn);
  const start = Date.UTC(s.y, s.m - 1, s.day);
  const e = parse(endsOn);
  const end = Date.UTC(e.y, e.m - 1, e.day);
  for (let t = start; t <= end && out.length < 15; t += 86_400_000) {
    const d = new Date(t);
    out.push({ iso: d.toISOString().slice(0, 10), dow: DOW[d.getUTCDay()], n: d.getUTCDate() });
  }
  return out;
}

/** Tags and colours exactly as in the design's agenda (8c). */
export const SESSION_STYLE: Record<SessionKind, { tag: string; bg: string; color: string }> = {
  workshop: { tag: "TALLER", bg: "#FFFFFF", color: "#0D0A26" },
  masterclass: { tag: "MASTERCLASS", bg: "#FFC83D", color: "#0D0A26" },
  sports: { tag: "DEPORTES", bg: "#35D07F", color: "#0D0A26" },
  fine_arts: { tag: "BELLAS ARTES", bg: "#9B6BFF", color: "#FFFFFF" },
  exhibit: { tag: "EXHIBICIÓN", bg: "#FFFFFF", color: "#0D0A26" },
  night: { tag: "SERVICIO DE NOCHE", bg: "#0D0A26", color: "#F4F2EC" },
  closing: { tag: "CLAUSURA", bg: "#FF6B4A", color: "#0D0A26" },
  other: { tag: "ACTIVIDAD", bg: "#FFFFFF", color: "#0D0A26" },
};

/** "QUÉ HAY" chips cycle through the design colours. */
const CHIP_COLORS: Array<[string, string]> = [
  ["#35D07F", "#0D0A26"],
  ["#9B6BFF", "#FFFFFF"],
  ["#FFC83D", "#0D0A26"],
  ["#3D8BFF", "#FFFFFF"],
  ["#0D0A26", "#FFFFFF"],
  ["#FF8A3D", "#0D0A26"],
];
export function chipColor(i: number): [string, string] {
  return CHIP_COLORS[i % CHIP_COLORS.length];
}

/** "9:00" from "09:00:00". */
export function sessionTime(t: string): string {
  const [h, m] = t.split(":");
  return `${Number(h)}:${m}`;
}

/** Badge code shown on "MI GAFETE": short, readable, uppercase. */
export function badgeLabel(code: string): string {
  return code
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase()
    .replace(/(.{4})/, "$1-");
}
