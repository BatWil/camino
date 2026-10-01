import type { QuestionCategory } from "@/lib/supabase/database.types";

/** Chips of screen 7a, in order. */
export const QUESTION_CATEGORIES: ReadonlyArray<{ id: QuestionCategory; label: string }> = [
  { id: "faith", label: "Fe" },
  { id: "bible", label: "Biblia" },
  { id: "relationships", label: "Relaciones" },
  { id: "doubts", label: "Dudas" },
];

export function categoryLabel(c: QuestionCategory): string {
  return QUESTION_CATEGORIES.find((q) => q.id === c)?.label ?? "Otra";
}

export function anonymityNote(anonymous: boolean): string {
  return anonymous
    ? "Tu líder no verá tu nombre. La respuesta llegará solo a ti."
    : "Tu líder verá tu nombre y podrá darte seguimiento personal.";
}

export const QUESTION_MIN = 5;
export const QUESTION_MAX = 2000;

export function canSendQuestion(body: string): boolean {
  const len = body.trim().length;
  return len >= QUESTION_MIN && len <= QUESTION_MAX;
}
