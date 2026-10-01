import type { Mood } from "@/lib/supabase/database.types";

/** Screen 4c moods, labels and colours exactly as designed. */
export const MOODS: ReadonlyArray<{ mood: Mood; label: string; color: string }> = [
  { mood: "joy", label: "Con gozo", color: "#FFC83D" },
  { mood: "peace", label: "En paz", color: "#35D07F" },
  { mood: "tired", label: "Cansado", color: "#3D8BFF" },
  { mood: "anxious", label: "Ansioso", color: "#9B6BFF" },
  { mood: "lonely", label: "Solo", color: "#FF8A3D" },
  { mood: "doubts", label: "Con dudas", color: "#FF6B4A" },
];

export function moodMeta(mood: Mood) {
  return MOODS.find((m) => m.mood === mood)!;
}
