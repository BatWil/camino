/** Local calendar date as yyyy-mm-dd (the device's day, which the server mirrors via profiles.timezone). */
export function localIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

/** Monday of the week containing `d` (ISO weeks, like the server's date_trunc('week')). */
export function weekStart(d: Date): Date {
  const day = (d.getDay() + 6) % 7; // Monday = 0
  return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -day);
}

export interface RhythmDay {
  date: string;
  active: boolean;
  isToday: boolean;
}

export interface Rhythm {
  days: RhythmDay[];
  activeCount: number;
  todayActive: boolean;
  /** Kind, never guilt-inducing (see docs/design-system.md · Tono). */
  message: string;
}

/**
 * "Tu ritmo": the last 7 days ending today. Celebrates consistency and
 * returning; there is no streak to lose.
 */
export function computeRhythm(activeDates: string[], today: Date): Rhythm {
  const set = new Set(activeDates);
  const days: RhythmDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = localIsoDate(addDays(today, i - 6));
    return { date, active: set.has(date), isToday: i === 6 };
  });
  const activeCount = days.filter((d) => d.active).length;
  const todayActive = days[6].active;

  let message: string;
  if (activeCount === 0) message = "Hoy también puedes dar un paso.";
  else if (activeCount === 7) message = "Apartaste tiempo para Dios cada día de esta semana.";
  else if (!todayActive && !days[5].active) message = "Siempre puedes volver. Hoy es un buen día.";
  else message = `Esta semana apartaste tiempo ${activeCount} ${activeCount === 1 ? "día" : "días"}.`;

  return { days, activeCount, todayActive, message };
}
