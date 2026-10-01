export interface StoryStats {
  activeDays: number;
  journalEntries: number;
  firstJournalAt: string | null;
  answeredPrayers: number;
  prayerMinutes: number;
  plansCompleted: number;
  devotionalsCompleted: number;
  startedAt: string | null;
}

/** "hoy", "hace 3 días", "hace 2 semanas", "hace 6 meses", "hace 1 año". */
export function relativeSince(iso: string, now: Date = new Date()): string {
  const days = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000));
  if (days === 0) return "hoy";
  if (days < 14) return `hace ${days} ${days === 1 ? "día" : "días"}`;
  if (days < 60) return `hace ${Math.floor(days / 7)} semanas`;
  if (days < 365) {
    const m = Math.floor(days / 30);
    return `hace ${m} ${m === 1 ? "mes" : "meses"}`;
  }
  const y = Math.floor(days / 365);
  return `hace ${y} ${y === 1 ? "año" : "años"}`;
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * Narrative lines for "Mira cuánto has recorrido": a story, not a scoreboard.
 * Only non-zero achievements are mentioned; nothing is compared with anyone.
 */
export function storyLines(stats: StoryStats): string[] {
  const lines: string[] = [];
  if (stats.activeDays > 0) lines.push(`Apartaste tiempo para Dios ${plural(stats.activeDays, "día", "días")}.`);
  if (stats.devotionalsCompleted > 0)
    lines.push(`Recorriste ${plural(stats.devotionalsCompleted, "devocional", "devocionales")}.`);
  if (stats.plansCompleted > 0) lines.push(`Terminaste ${plural(stats.plansCompleted, "plan", "planes")}.`);
  if (stats.prayerMinutes > 0) lines.push(`Pasaste ${plural(stats.prayerMinutes, "minuto", "minutos")} en oración.`);
  if (stats.answeredPrayers > 0)
    lines.push(`Viste ${plural(stats.answeredPrayers, "oración respondida", "oraciones respondidas")}.`);
  if (stats.journalEntries > 0)
    lines.push(`Escribiste ${plural(stats.journalEntries, "página", "páginas")} en tu diario.`);
  return lines;
}
