export function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `$${Math.round(amount).toLocaleString("es-MX")}`;
  }
}

export function progressPercent(raised: number, goal: number): number {
  if (!goal || goal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((raised / goal) * 100)));
}

/** "$50 · $100 · Otro" (8f). */
export const PRESET_AMOUNTS = [50, 100] as const;

export function parseAmount(raw: string): number | null {
  const n = Number(raw.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n <= 0 || n > 1_000_000) return null;
  return Math.round(n * 100) / 100;
}
