import { describe, expect, it } from "vitest";
import { filterPlans, matchesSearch, onPlanColor } from "./plans";

const plans = [
  {
    id: "1",
    title: "Ansiedad y confianza",
    summary: "Paz",
    source: "PLATFORM",
    category: "daily_life" as const,
    recommended_stage_id: "crece",
    growth_areas: ["prayer"],
  },
  {
    id: "2",
    title: "Liderar sirviendo",
    summary: "Guía",
    source: "PLATFORM",
    category: "leadership" as const,
    recommended_stage_id: "guia",
    growth_areas: ["service"],
  },
  {
    id: "3",
    title: "Serie de la iglesia",
    summary: "Juan",
    source: "CHURCH",
    category: "foundations" as const,
    recommended_stage_id: null,
    growth_areas: ["bible"],
  },
];

describe("plan library", () => {
  it("Para ti uses the current stage and onboarding interests", () => {
    expect(filterPlans(plans, "for_you", { stageId: "crece", interests: [] }).map((p) => p.id)).toEqual(["1"]);
    expect(filterPlans(plans, "for_you", { stageId: null, interests: ["bible"] }).map((p) => p.id)).toEqual(["3"]);
  });

  it("filters by church and category", () => {
    expect(filterPlans(plans, "church", { stageId: null, interests: [] }).map((p) => p.id)).toEqual(["3"]);
    expect(filterPlans(plans, "leadership", { stageId: null, interests: [] }).map((p) => p.id)).toEqual(["2"]);
  });

  it("search ignores accents and case", () => {
    expect(matchesSearch(plans[0], "ANSIEDAD")).toBe(true);
    expect(matchesSearch({ title: "Identidad en Cristo", summary: "" }, "identidad cristo")).toBe(false);
    expect(matchesSearch({ title: "Oración", summary: "" }, "oracion")).toBe(true);
  });

  it("picks readable text on each design colour", () => {
    expect(onPlanColor("#9B6BFF")).toBe("#FFFFFF");
    expect(onPlanColor("#FFC83D")).toBe("#0D0A26");
  });
});
