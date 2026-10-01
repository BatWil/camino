export interface CallingProgress {
  started: boolean;
  planCompleted: boolean;
  planId: string | null;
  pastorRequested: boolean;
  servingSince: string | null;
  studiesExplored: boolean;
}

export function parseCallingProgress(raw: unknown): CallingProgress {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    started: o.started === true,
    planCompleted: o.plan_completed === true,
    planId: typeof o.plan_id === "string" ? o.plan_id : null,
    pastorRequested: o.pastor_requested === true,
    servingSince: typeof o.serving_since === "string" ? o.serving_since : null,
    studiesExplored: o.studies_explored === true,
  };
}

/** Months of service since `since` (whole months). */
export function monthsServing(since: string | null, now: Date = new Date()): number {
  if (!since) return 0;
  const d = new Date(since);
  return Math.max(
    0,
    (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth() - (now.getDate() < d.getDate() ? 1 : 0),
  );
}

export type StepState = "done" | "current" | "next";

/** The 4 steps of screen 8g; the first unfinished one is "current". */
export function callingSteps(p: CallingProgress, now: Date = new Date()) {
  const months = monthsServing(p.servingSince, now);
  const raw = [
    { id: "plan", title: "Plan: Escuchar el llamado", done: p.planCompleted },
    { id: "pastor", title: "Hablar con mi pastor", done: p.pastorRequested },
    { id: "serve", title: "Servir 3 meses en un ministerio", done: months >= 3, months },
    { id: "studies", title: "Explorar estudios y formación", done: p.studiesExplored },
  ];
  let currentSet = false;
  return raw.map((s) => {
    let state: StepState = s.done ? "done" : "next";
    if (!s.done && !currentSet) {
      state = "current";
      currentSet = true;
    }
    return { ...s, state };
  });
}
