import type { MomentKind } from "@/lib/supabase/database.types";

export const MOMENT_META: Record<MomentKind, { label: string; color: string; manual: boolean }> = {
  journey_started: { label: "Comencé Camino", color: "#C6F432", manual: false },
  faith_decision: { label: "Decisión de fe", color: "#FFC83D", manual: true },
  baptism: { label: "Bautismo", color: "#3D8BFF", manual: true },
  first_service: { label: "Primera vez sirviendo", color: "#FF8A3D", manual: true },
  first_preaching: { label: "Primera predicación", color: "#9B6BFF", manual: true },
  prayer_answered: { label: "Oración respondida", color: "#C6F432", manual: true },
  plan_completed: { label: "Plan completado", color: "#35D07F", manual: false },
  stage_reached: { label: "Nueva etapa", color: "#35D07F", manual: false },
  calling: { label: "Llamado", color: "#FF4D5E", manual: true },
  mission: { label: "Misión", color: "#FF6B4A", manual: true },
  custom: { label: "Otro momento", color: "#F4F2EC", manual: true },
};

export const MANUAL_KINDS = (Object.keys(MOMENT_META) as MomentKind[]).filter((k) => MOMENT_META[k].manual);

export function groupByYear<T extends { happened_on: string }>(items: T[]): Array<{ year: number; items: T[] }> {
  const map = new Map<number, T[]>();
  for (const item of [...items].sort((a, b) => b.happened_on.localeCompare(a.happened_on))) {
    const year = Number(item.happened_on.slice(0, 4));
    map.set(year, [...(map.get(year) ?? []), item]);
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0]).map(([year, items]) => ({ year, items }));
}
