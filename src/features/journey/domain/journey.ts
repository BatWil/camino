import type { ModuleKind, ProgressStatus } from "@/lib/supabase/database.types";
import type { JourneyStage } from "./stages";

export interface JourneyModule {
  id: string;
  stageId: string;
  position: number;
  title: string;
  kind: ModuleKind;
  devotionalId: string | null;
  planId: string | null;
  optional: boolean;
}

export interface ModuleProgress {
  moduleId: string;
  status: ProgressStatus;
}

/**
 * Node states in "Mi Camino". There is no "locked": every module stays
 * explorable; "recommended" is only a gentle suggestion of what's next.
 */
export type ModuleState = "completed" | "current" | "recommended" | "available";
export type StageState = "passed" | "current" | "upcoming";

export interface ModuleView extends JourneyModule {
  state: ModuleState;
}

export interface StageView {
  stage: JourneyStage;
  state: StageState;
  modules: ModuleView[];
  completedCount: number;
  requiredCount: number;
  /** 0–100, share of required modules completed. */
  percent: number;
}

export function buildJourney(
  stages: JourneyStage[],
  modules: JourneyModule[],
  progress: ModuleProgress[],
  currentStageId: string | null,
): StageView[] {
  const statusById = new Map(progress.map((p) => [p.moduleId, p.status]));
  const current = stages.find((s) => s.id === currentStageId) ?? stages[0];

  return [...stages]
    .sort((a, b) => a.position - b.position)
    .map((stage) => {
      const state: StageState =
        !current || stage.position === current.position
          ? "current"
          : stage.position < current.position
            ? "passed"
            : "upcoming";
      const own = modules.filter((m) => m.stageId === stage.id).sort((a, b) => a.position - b.position);

      let recommended = false;
      const views: ModuleView[] = own.map((m) => {
        const status = statusById.get(m.id);
        if (status === "completed") return { ...m, state: "completed" };
        if (status === "in_progress") return { ...m, state: "current" };
        if (state === "current" && !recommended) {
          recommended = true;
          return { ...m, state: "recommended" };
        }
        return { ...m, state: "available" };
      });
      // If something is already in progress, that is the suggestion; don't add a second one.
      if (views.some((v) => v.state === "current")) {
        for (const v of views) if (v.state === "recommended") v.state = "available";
      }

      const required = views.filter((v) => !v.optional);
      const completedCount = required.filter((v) => v.state === "completed").length;
      const requiredCount = required.length;
      const percent = requiredCount === 0 ? 0 : Math.round((completedCount / requiredCount) * 100);
      return { stage, state, modules: views, completedCount, requiredCount, percent };
    });
}

/** The module to continue or start next in the current stage (in progress first, then recommended). */
export function nextModule(journey: StageView[]): ModuleView | null {
  const current = journey.find((s) => s.state === "current");
  if (!current) return null;
  return (
    current.modules.find((m) => m.state === "current") ?? current.modules.find((m) => m.state === "recommended") ?? null
  );
}
