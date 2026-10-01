import { describe, expect, it } from "vitest";
import { chooseTodayStep, nextPlanDay, type ActivePlan } from "./next-step";

const dev = (id: string) => ({ id, title: id, minutes: 5, scriptureRef: "Salmo 1" });
const plan: ActivePlan = {
  userPlanId: "up1",
  planId: "p1",
  title: "Construyendo constancia",
  color: "#35D07F",
  startedAt: "2026-09-29T10:00:00Z",
  days: [1, 2, 3].map((n) => ({ dayNumber: n, devotional: dev(`d${n}`) })),
  completedDays: [1],
};

describe("Mi paso de hoy", () => {
  it("continues the active plan first", () => {
    const step = chooseTodayStep({ activePlans: [plan], inProgress: [], suggested: null });
    expect(step).toMatchObject({ kind: "plan_day", dayNumber: 2, totalDays: 3 });
  });

  it("then a devotional left halfway", () => {
    const step = chooseTodayStep({
      activePlans: [],
      inProgress: [{ devotional: dev("x"), completedSteps: ["read", "reflect", "think"], updatedAt: "2026-10-01" }],
      suggested: null,
    });
    expect(step).toMatchObject({ kind: "devotional", progress: 0.5, started: true });
  });

  it("then what Mi Camino suggests", () => {
    expect(
      chooseTodayStep({
        activePlans: [],
        inProgress: [],
        suggested: { title: "Constancia", kind: "plan", devotional: null, planId: "p9" },
      }),
    ).toEqual({ kind: "plan", planId: "p9", title: "Constancia" });
  });

  it("invites to explore when there is nothing pending", () => {
    expect(chooseTodayStep({ activePlans: [], inProgress: [], suggested: null })).toEqual({ kind: "explore" });
  });

  it("finds no next day when a plan is finished", () => {
    expect(nextPlanDay({ ...plan, completedDays: [1, 2, 3] })).toBeNull();
  });
});
