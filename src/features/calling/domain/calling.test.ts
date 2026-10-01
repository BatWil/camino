import { describe, expect, it } from "vitest";
import { callingSteps, monthsServing, parseCallingProgress } from "./calling";

const now = new Date(2026, 9, 1);

describe("calling", () => {
  it("parses progress defensively", () => {
    expect(parseCallingProgress(null).started).toBe(false);
    expect(parseCallingProgress({ started: true, plan_id: "p" })).toMatchObject({ started: true, planId: "p" });
  });

  it("counts whole months of service", () => {
    expect(monthsServing("2026-06-15T00:00:00Z", now)).toBe(3);
    expect(monthsServing("2026-09-20T00:00:00Z", now)).toBe(0);
    expect(monthsServing(null, now)).toBe(0);
  });

  it("marks the first unfinished step as current", () => {
    const steps = callingSteps(
      {
        started: true,
        planCompleted: true,
        planId: "p",
        pastorRequested: false,
        servingSince: null,
        studiesExplored: false,
      },
      now,
    );
    expect(steps.map((s) => s.state)).toEqual(["done", "current", "next", "next"]);
  });
});
