import type { Database, QuestionCategory, Tables } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";

type Fn<K extends keyof Database["public"]["Functions"]> = Database["public"]["Functions"][K]["Returns"];

export type MyQuestion = Tables<"questions"> & { answer: string | null };
export type FaqItem = Fn<"church_faq">[number];
export type InboxQuestion = Fn<"leader_questions">[number];

/**
 * Questions. The author reads their own rows; leaders only see them through
 * leader_questions(), which never returns who asked an anonymous question.
 */
export const questionsRepository = {
  async ask(input: {
    churchId: string;
    category: QuestionCategory;
    body: string;
    isAnonymous: boolean;
    verseRef: string | null;
  }) {
    const { error } = await requireSupabase().from("questions").insert({
      church_id: input.churchId,
      category: input.category,
      body: input.body,
      is_anonymous: input.isAnonymous,
      verse_ref: input.verseRef,
    });
    if (error) throw new AppError("unknown", "No pudimos enviar tu pregunta.", error);
  },

  async mine(userId: string): Promise<MyQuestion[]> {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("questions")
      .select("*")
      .eq("author_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new AppError("unknown", "No pudimos cargar tus preguntas.", error);
    if (!data.length) return [];
    const { data: answers, error: aErr } = await sb
      .from("question_answers")
      .select("question_id, body")
      .in(
        "question_id",
        data.map((q) => q.id),
      );
    if (aErr) throw new AppError("unknown", "No pudimos cargar las respuestas.", aErr);
    const byQuestion = new Map(answers.map((a) => [a.question_id, a.body]));
    return data.map((q) => ({ ...q, answer: byQuestion.get(q.id) ?? null }));
  },

  async faq(churchId: string): Promise<FaqItem[]> {
    const { data, error } = await requireSupabase().rpc("church_faq", { p_church_id: churchId });
    if (error) throw new AppError("unknown", "No pudimos cargar las preguntas frecuentes.", error);
    return data;
  },

  async inbox(churchId: string): Promise<InboxQuestion[]> {
    const { data, error } = await requireSupabase().rpc("leader_questions", { p_church_id: churchId });
    if (error) throw new AppError("unknown", "No pudimos cargar las preguntas.", error);
    return data;
  },

  async answer(questionId: string, body: string, publishFaq: boolean) {
    const { error } = await requireSupabase().rpc("answer_question", {
      p_question_id: questionId,
      p_body: body,
      p_publish_faq: publishFaq,
    });
    if (error) throw new AppError("unknown", "No pudimos guardar la respuesta.", error);
  },
};
