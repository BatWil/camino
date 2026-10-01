import type { DevotionalStep } from "@/lib/supabase/database.types";

export const DEVOTIONAL_STEPS: readonly DevotionalStep[] = ["read", "reflect", "think", "write", "pray", "act"];

export interface DevotionalSummary {
  id: string;
  title: string;
  minutes: number;
  scriptureRef: string;
}

export interface ActivePlan {
  userPlanId: string;
  planId: string;
  title: string;
  color: string;
  startedAt: string;
  days: Array<{ dayNumber: number; devotional: DevotionalSummary }>;
  completedDays: number[];
}

export interface InProgressDevotional {
  devotional: DevotionalSummary;
  completedSteps: DevotionalStep[];
  updatedAt: string;
}

export interface SuggestedModule {
  title: string;
  kind: "devotional" | "plan" | "experience";
  devotional: DevotionalSummary | null;
  planId: string | null;
}

export type TodayStep =
  | {
      kind: "plan_day";
      userPlanId: string;
      planTitle: string;
      dayNumber: number;
      totalDays: number;
      devotional: DevotionalSummary;
      /** 0–1 */
      progress: number;
    }
  | { kind: "devotional"; devotional: DevotionalSummary; progress: number; started: boolean }
  | { kind: "plan"; planId: string; title: string }
  | { kind: "explore" };

/** Next unfinished day of a plan, or null when every day is done. */
export function nextPlanDay(plan: ActivePlan) {
  const done = new Set(plan.completedDays);
  return [...plan.days].sort((a, b) => a.dayNumber - b.dayNumber).find((d) => !done.has(d.dayNumber)) ?? null;
}

/**
 * "¿Cuál es mi siguiente paso hoy?" — one clear suggestion, in this order:
 * 1. the next day of the plan you're in, 2. a devotional you left halfway,
 * 3. what Mi Camino suggests next, 4. an invitation to explore.
 */
export function chooseTodayStep(input: {
  activePlans: ActivePlan[];
  inProgress: InProgressDevotional[];
  suggested: SuggestedModule | null;
}): TodayStep {
  const plans = [...input.activePlans].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  for (const plan of plans) {
    const day = nextPlanDay(plan);
    if (day) {
      return {
        kind: "plan_day",
        userPlanId: plan.userPlanId,
        planTitle: plan.title,
        dayNumber: day.dayNumber,
        totalDays: plan.days.length,
        devotional: day.devotional,
        progress: plan.days.length ? plan.completedDays.length / plan.days.length : 0,
      };
    }
  }

  const halfway = [...input.inProgress].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  if (halfway) {
    return {
      kind: "devotional",
      devotional: halfway.devotional,
      progress: Math.min(1, halfway.completedSteps.length / DEVOTIONAL_STEPS.length),
      started: true,
    };
  }

  const s = input.suggested;
  if (s?.kind === "devotional" && s.devotional)
    return { kind: "devotional", devotional: s.devotional, progress: 0, started: false };
  if (s?.kind === "plan" && s.planId) return { kind: "plan", planId: s.planId, title: s.title };
  return { kind: "explore" };
}
