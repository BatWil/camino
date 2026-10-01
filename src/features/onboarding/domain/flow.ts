import type { Expectation, FaithStatus, GrowthArea } from "@/lib/supabase/database.types";

/** Mirrors public.min_account_age() — the server is the authority. */
export const MIN_AGE = 13;
export const TOTAL_STEPS = 6;

export type StepNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface OnboardingResult {
  stageKey: string;
  stageName: string;
  stageDescription: string | null;
}

export interface OnboardingState {
  step: StepNumber | "done";
  displayName: string;
  birthDate: string; // yyyy-mm-dd
  churchName: string | null;
  faithStatus: FaithStatus | null;
  growthAreas: GrowthArea[];
  expectations: Expectation[];
  result: OnboardingResult | null;
}

export type OnboardingAction =
  | { type: "set"; patch: Partial<Pick<OnboardingState, "displayName" | "birthDate" | "faithStatus">> }
  | { type: "toggleGrowth"; value: GrowthArea }
  | { type: "toggleExpectation"; value: Expectation }
  | { type: "joinedChurch"; name: string }
  | { type: "next" }
  | { type: "back" }
  | { type: "completed"; result: OnboardingResult };

export function initialOnboardingState(displayName = ""): OnboardingState {
  return {
    step: 1,
    displayName,
    birthDate: "",
    churchName: null,
    faithStatus: null,
    growthAreas: [],
    expectations: [],
    result: null,
  };
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case "set":
      return { ...state, ...action.patch };
    case "toggleGrowth":
      return { ...state, growthAreas: toggle(state.growthAreas, action.value) };
    case "toggleExpectation":
      return { ...state, expectations: toggle(state.expectations, action.value) };
    case "joinedChurch":
      return { ...state, churchName: action.name };
    case "next":
      if (state.step === "done" || state.step === TOTAL_STEPS || !canContinue(state)) return state;
      return { ...state, step: (state.step + 1) as StepNumber };
    case "back":
      if (state.step === "done" || state.step === 1) return state;
      return { ...state, step: (state.step - 1) as StepNumber };
    case "completed":
      return { ...state, step: "done", result: action.result };
  }
}

/** Whole years between a yyyy-mm-dd birth date and `today`. Null if invalid. */
export function ageOn(birthDate: string, today: Date = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  let age = today.getFullYear() - y;
  const beforeBirthday = today.getMonth() + 1 < mo || (today.getMonth() + 1 === mo && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

export function birthDateProblem(birthDate: string, today: Date = new Date()): string | null {
  if (!birthDate) return "¿Cuándo naciste?";
  const age = ageOn(birthDate, today);
  if (age === null || age < 0 || age > 120) return "Revisa la fecha.";
  if (age < MIN_AGE) return `Camino es para jóvenes de ${MIN_AGE} años en adelante.`;
  return null;
}

export function canContinue(state: OnboardingState, today: Date = new Date()): boolean {
  switch (state.step) {
    case 1: {
      const name = state.displayName.trim();
      return name.length >= 1 && name.length <= 80 && birthDateProblem(state.birthDate, today) === null;
    }
    case 2:
    case 3:
      return true; // church and photo are optional
    case 4:
      return state.faithStatus !== null;
    case 5:
      return state.growthAreas.length > 0;
    case 6:
      return state.expectations.length > 0;
    default:
      return false;
  }
}
