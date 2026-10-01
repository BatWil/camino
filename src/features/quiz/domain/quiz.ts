export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer_index: number;
  verse_ref: string | null;
  chapter: number;
}

export const LETTERS = ["A", "B", "C", "D"] as const;

/** Deterministic shuffle (mulberry32) so a session is stable across re-renders. */
export function shuffle<T>(items: readonly T[], seed: number): T[] {
  let a = seed >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Practice round: up to `size` questions, in a seeded random order. */
export function buildRound(all: readonly QuizQuestion[], size: number, seed: number): QuizQuestion[] {
  return shuffle(all, seed).slice(0, size);
}

/** Kind feedback, no points or rankings: "¡correcto! ✦" / "casi… es la B. ¡sigue!". */
export function feedback(q: QuizQuestion, picked: number): { correct: boolean; text: string } {
  const correct = picked === q.answer_index;
  return { correct, text: correct ? "¡correcto! ✦" : `casi… es la ${LETTERS[q.answer_index]}. ¡sigue!` };
}

export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function finishMessage(correct: number, total: number): string {
  if (!total) return "";
  const ratio = correct / total;
  if (ratio === 1) return "¡Perfecto! Conoces muy bien este libro.";
  if (ratio >= 0.7) return "¡Muy bien! Sigue practicando.";
  if (ratio >= 0.4) return "Vas avanzando. Cada práctica cuenta.";
  return "Buen comienzo. Lee el libro y vuelve a intentarlo.";
}
