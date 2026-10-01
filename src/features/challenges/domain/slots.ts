const WEEKDAYS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

export function weekdayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

export type Slot =
  | { kind: "done"; label: string; undoable: boolean }
  | { kind: "today"; label: string; undoable: false }
  | { kind: "empty"; label: string; undoable: false };

/**
 * Slots for screen 6a: one per target day. Done days show their weekday; the
 * next slot is "today" (tap to complete) unless today is already done, in which
 * case today's slot can be undone. Only today can be marked (no backfilling).
 */
export function challengeSlots(checkins: string[], target: number, todayIso: string): Slot[] {
  const days = [...new Set(checkins)].sort();
  const todayDone = days.includes(todayIso);
  return Array.from({ length: target }, (_, i): Slot => {
    if (i < days.length) return { kind: "done", label: weekdayLabel(days[i]), undoable: days[i] === todayIso };
    if (i === days.length && !todayDone) return { kind: "today", label: weekdayLabel(todayIso), undoable: false };
    return { kind: "empty", label: "", undoable: false };
  });
}

/** Handwritten note under the slots (design: "3 de 5 · ¡vas muy bien!"). */
export function challengeMessage(done: number, target: number): string {
  if (done >= target) return "¡reto completado! ✦";
  if (done === 0) return "hoy puedes empezar ✦";
  return `${done} de ${target} · ¡vas muy bien!`;
}
