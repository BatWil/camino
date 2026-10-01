import { describe, expect, it } from "vitest";
import {
  ageOn,
  birthDateProblem,
  canContinue,
  initialOnboardingState,
  onboardingReducer,
  type OnboardingState,
} from "./flow";

const today = new Date(2026, 9, 1); // 1 Oct 2026

describe("age", () => {
  it("counts whole years, respecting the birthday", () => {
    expect(ageOn("2010-10-01", today)).toBe(16);
    expect(ageOn("2010-10-02", today)).toBe(15);
  });

  it("rejects impossible dates", () => {
    expect(ageOn("2010-02-30", today)).toBeNull();
    expect(ageOn("hello", today)).toBeNull();
  });

  it("requires the minimum age kindly", () => {
    expect(birthDateProblem("2015-01-01", today)).toMatch(/13 años/);
    expect(birthDateProblem("2013-10-01", today)).toBeNull();
    expect(birthDateProblem("", today)).toBe("¿Cuándo naciste?");
  });
});

describe("onboarding flow", () => {
  const filled: OnboardingState = { ...initialOnboardingState("Daniel"), birthDate: "2008-05-01" };

  it("does not advance from step 1 without valid basics", () => {
    const s = onboardingReducer(initialOnboardingState(""), { type: "next" });
    expect(s.step).toBe(1);
  });

  it("church (2) and photo (3) are optional", () => {
    let s = onboardingReducer(filled, { type: "next" });
    expect(s.step).toBe(2);
    s = onboardingReducer(s, { type: "next" });
    expect(s.step).toBe(3);
    s = onboardingReducer(s, { type: "next" });
    expect(s.step).toBe(4);
  });

  it("requires a faith answer and at least one choice in the multi-selects", () => {
    let s: OnboardingState = { ...filled, step: 4 };
    expect(canContinue(s, today)).toBe(false);
    s = onboardingReducer(s, { type: "set", patch: { faithStatus: "growing" } });
    s = onboardingReducer(s, { type: "next" });
    expect(s.step).toBe(5);
    expect(canContinue(s, today)).toBe(false);
    s = onboardingReducer(s, { type: "toggleGrowth", value: "bible" });
    s = onboardingReducer(s, { type: "toggleGrowth", value: "prayer" });
    s = onboardingReducer(s, { type: "toggleGrowth", value: "bible" });
    expect(s.growthAreas).toEqual(["prayer"]);
    s = onboardingReducer(s, { type: "next" });
    expect(s.step).toBe(6);
    expect(canContinue(s, today)).toBe(false);
  });

  it("goes back without losing answers and never past step 1", () => {
    let s: OnboardingState = { ...filled, step: 3, churchName: "Iglesia Vida Nueva" };
    s = onboardingReducer(s, { type: "back" });
    s = onboardingReducer(s, { type: "back" });
    s = onboardingReducer(s, { type: "back" });
    expect(s.step).toBe(1);
    expect(s.churchName).toBe("Iglesia Vida Nueva");
    expect(s.displayName).toBe("Daniel");
  });

  it("finishes with the server result", () => {
    const s = onboardingReducer(
      { ...filled, step: 6 },
      {
        type: "completed",
        result: { stageKey: "crece", stageName: "CRECE", stageDescription: null },
      },
    );
    expect(s.step).toBe("done");
    expect(s.result?.stageKey).toBe("crece");
  });
});
