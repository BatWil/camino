/**
 * Journey stages ("Mi Camino"). Names/descriptions come from the database;
 * each stage's visual identity (colour) is a design token defined here and in
 * globals.css so both always match the design file.
 */
export const STAGE_KEYS = ["encuentra", "crece", "vive", "sirve", "comparte", "guia"] as const;
export type StageKey = (typeof STAGE_KEYS)[number];

export interface StageTheme {
  /** Background colour (exact value from the design). */
  color: string;
  /** Text colour used on top of the stage colour in the design. */
  onColor: string;
}

export const STAGE_THEME: Record<StageKey, StageTheme> = {
  encuentra: { color: "#FFC83D", onColor: "#0D0A26" },
  crece: { color: "#35D07F", onColor: "#0D0A26" },
  vive: { color: "#3D8BFF", onColor: "#FFFFFF" },
  sirve: { color: "#FF8A3D", onColor: "#0D0A26" },
  comparte: { color: "#9B6BFF", onColor: "#FFFFFF" },
  guia: { color: "#FF4D5E", onColor: "#FFFFFF" },
};

const FALLBACK_THEME: StageTheme = { color: "#FFFFFF", onColor: "#0D0A26" };

export function isStageKey(value: string): value is StageKey {
  return (STAGE_KEYS as readonly string[]).includes(value);
}

export function stageTheme(key: string): StageTheme {
  return isStageKey(key) ? STAGE_THEME[key] : FALLBACK_THEME;
}

export interface JourneyStage {
  id: string;
  key: string;
  position: number;
  name: string;
  description: string | null;
}

export function sortStages<T extends Pick<JourneyStage, "position">>(stages: T[]): T[] {
  return [...stages].sort((a, b) => a.position - b.position);
}

/** "01", "02" … as used in the stacked tickets of "Mi Camino". */
export function stageNumber(position: number): string {
  return String(position).padStart(2, "0");
}
