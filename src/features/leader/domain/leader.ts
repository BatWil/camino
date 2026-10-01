import { LEADER_PANEL_ROLES, type UserAccess } from "@/features/churches/domain/access";

export interface LeaderOverview {
  youth: number;
  activeWeek: number;
  inPlans: number;
  wantServe: number;
  conversations: number;
  newQuestions: number;
}

export function parseOverview(raw: unknown): LeaderOverview {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const n = (k: string) => (typeof o[k] === "number" ? (o[k] as number) : Number(o[k]) || 0);
  return {
    youth: n("youth"),
    activeWeek: n("active_week"),
    inPlans: n("in_plans"),
    wantServe: n("want_serve"),
    conversations: n("conversations"),
    newQuestions: n("new_questions"),
  };
}

export function activePercent(o: LeaderOverview): number {
  return o.youth ? Math.round((o.activeWeek / o.youth) * 100) : 0;
}

/** Church the leader panel works on: the selected church if the person leads it, else the first one they lead. */
export function leaderChurchId(access: UserAccess, selected: string | null): string | null {
  const led = access.roles
    .filter((r) => LEADER_PANEL_ROLES.includes(r.role) && r.churchId)
    .map((r) => r.churchId!) as string[];
  if (selected && led.includes(selected)) return selected;
  return led[0] ?? null;
}

/** "Daniel Ramírez" → "Daniel R." (design 3a). */
export function shortName(name: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Sin nombre";
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}
