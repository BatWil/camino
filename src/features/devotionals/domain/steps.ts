import type { DevotionalStep } from "@/lib/supabase/database.types";

/** Chips of screen 2e, in order. */
export const STEP_LABELS: ReadonlyArray<{ step: DevotionalStep; label: string }> = [
  { step: "read", label: "Leer" },
  { step: "reflect", label: "Reflexionar" },
  { step: "think", label: "Pensar" },
  { step: "write", label: "Escribir" },
  { step: "pray", label: "Orar" },
  { step: "act", label: "Actuar" },
];

/** 1-based position of the first step not done yet (6 when all are done). */
export function currentStepNumber(done: ReadonlyArray<DevotionalStep>): number {
  const index = STEP_LABELS.findIndex(({ step }) => !done.includes(step));
  return index === -1 ? STEP_LABELS.length : index + 1;
}

export const READING_SCALES = [1, 1.15, 1.3] as const;

export function nextReadingScale(current: number): number {
  const i = READING_SCALES.findIndex((s) => Math.abs(s - current) < 0.01);
  return READING_SCALES[(i + 1) % READING_SCALES.length];
}
