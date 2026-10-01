import { describe, expect, it } from "vitest";
import { buildJourney, nextModule, type JourneyModule } from "./journey";
import type { JourneyStage } from "./stages";

const stages: JourneyStage[] = [
  { id: "s1", key: "encuentra", position: 1, name: "ENCUENTRA", description: null },
  { id: "s2", key: "crece", position: 2, name: "CRECE", description: null },
  { id: "s3", key: "vive", position: 3, name: "VIVE", description: null },
];
const mod = (id: string, stageId: string, position: number, optional = false): JourneyModule => ({
  id,
  stageId,
  position,
  title: id,
  kind: "devotional",
  devotionalId: `d-${id}`,
  planId: null,
  optional,
});
const modules = [
  mod("a", "s1", 1),
  mod("b", "s2", 1),
  mod("c", "s2", 2),
  mod("d", "s2", 3),
  mod("x", "s2", 4, true),
  mod("e", "s3", 1),
];

describe("Mi Camino", () => {
  it("marks stages before, at and after the current one", () => {
    const j = buildJourney(stages, modules, [], "s2");
    expect(j.map((s) => s.state)).toEqual(["passed", "current", "upcoming"]);
  });

  it("suggests the first unstarted module of the current stage, never locks the rest", () => {
    const j = buildJourney(stages, modules, [{ moduleId: "b", status: "completed" }], "s2");
    const crece = j[1];
    expect(crece.modules.map((m) => m.state)).toEqual(["completed", "recommended", "available", "available"]);
    expect(j[2].modules[0].state).toBe("available"); // future stages stay explorable
  });

  it("a module in progress is the suggestion", () => {
    const j = buildJourney(stages, modules, [{ moduleId: "d", status: "in_progress" }], "s2");
    expect(j[1].modules.map((m) => m.state)).toEqual(["available", "available", "current", "available"]);
    expect(nextModule(j)?.id).toBe("d");
  });

  it("computes progress from required modules only", () => {
    const j = buildJourney(
      stages,
      modules,
      [
        { moduleId: "b", status: "completed" },
        { moduleId: "x", status: "completed" },
      ],
      "s2",
    );
    expect(j[1].requiredCount).toBe(3);
    expect(j[1].completedCount).toBe(1);
    expect(j[1].percent).toBe(33);
  });

  it("falls back to the first stage when no stage is set yet", () => {
    expect(buildJourney(stages, modules, [], null)[0].state).toBe("current");
  });
});
