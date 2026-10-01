import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";
import type { QuizQuestion } from "../domain/quiz";

export const quizRepository = {
  /** Books that have published questions, with counts. */
  async books(): Promise<Array<{ book: string; count: number }>> {
    const { data, error } = await requireSupabase().from("quiz_questions").select("book");
    if (error) throw new AppError("unknown", "No pudimos cargar el quiz.", error);
    const counts = new Map<string, number>();
    for (const r of data) counts.set(r.book, (counts.get(r.book) ?? 0) + 1);
    return [...counts.entries()].map(([book, count]) => ({ book, count }));
  },

  async questions(book: string): Promise<QuizQuestion[]> {
    const { data, error } = await requireSupabase()
      .from("quiz_questions")
      .select("id, question, options, answer_index, verse_ref, chapter")
      .eq("book", book)
      .limit(200);
    if (error) throw new AppError("unknown", "No pudimos cargar las preguntas.", error);
    return data;
  },

  /** Private practice record (no rankings). */
  async saveAttempt(input: { book: string; correct: number; total: number; seconds: number }) {
    const { error } = await requireSupabase().from("quiz_attempts").insert(input);
    if (error) throw new AppError("unknown", "No pudimos guardar tu práctica.", error);
  },

  async best(book: string, userId: string): Promise<{ correct: number; total: number } | null> {
    const { data, error } = await requireSupabase()
      .from("quiz_attempts")
      .select("correct, total")
      .eq("user_id", userId)
      .eq("book", book)
      .order("correct", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new AppError("unknown", "No pudimos cargar tu práctica.", error);
    return data;
  },
};
