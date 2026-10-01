"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { StateView } from "@/components/feedback/state-view";
import { useCurrentChurch } from "@/features/churches/hooks/use-access";
import type { QuestionCategory } from "@/lib/supabase/database.types";
import { cn } from "@/utils/cn";
import { anonymityNote, canSendQuestion, QUESTION_CATEGORIES, QUESTION_MAX } from "../domain/questions";
import { useAskQuestion } from "../hooks/use-questions";

/** Screen 7a · "Ninguna pregunta es tonta". Anonymous by default. */
export function AskQuestionScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const verseRef = params.get("ref");
  const { church, isPending } = useCurrentChurch();
  const ask = useAskQuestion();
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<QuestionCategory>(verseRef ? "bible" : "faith");
  const [anonymous, setAnonymous] = useState(true);

  const close = () => (window.history.length > 1 ? router.back() : router.replace("/inicio"));

  if (!isPending && !church) {
    return (
      <main className="pt-safe flex min-h-dvh items-center bg-paper px-5">
        <StateView
          kind="empty"
          title="Pregunta a tus líderes"
          message="Para enviar preguntas necesitas estar conectado a tu iglesia."
          action={
            <ButtonLink href="/unirse" variant="ink" size="sm">
              Unirme a mi iglesia
            </ButtonLink>
          }
        />
      </main>
    );
  }

  if (ask.isSuccess) {
    return (
      <main className="pt-safe pb-safe flex min-h-dvh flex-col bg-paper">
        <div className="mx-auto flex w-full max-w-[600px] flex-1 flex-col gap-4 px-6 pt-16 pb-8">
          <span className="celebration-pop self-start rounded-full bg-stage-encuentra px-3 py-1.5 text-xs font-bold">
            Enviada ✓
          </span>
          <h1 className="m-0 font-display-x text-[34px] leading-[.9]">Gracias por preguntar</h1>
          <p className="m-0 text-[15px] leading-[1.45] text-ink/70">
            {anonymous
              ? "Tu pregunta llegó sin tu nombre. Verás la respuesta en Mis preguntas."
              : "Un líder te responderá en pocos días. Verás la respuesta en Mis preguntas."}
          </p>
          <div className="flex-1" />
          <ButtonLink href="/preguntas" variant="ink" size="lg" block className="h-[58px]">
            Ver mis preguntas
          </ButtonLink>
          <Button variant="ghost" size="md" block onClick={close}>
            Volver
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-safe pb-safe flex min-h-dvh flex-col bg-paper">
      <div className="mx-auto flex w-full max-w-[600px] flex-1 flex-col">
        <div className="flex items-center justify-between px-5 py-2">
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="flex size-10 items-center justify-center rounded-full bg-white"
          >
            <X className="size-[18px]" aria-hidden />
          </button>
          <Link href="/preguntas" className="text-[13px] font-semibold text-violet">
            Mis preguntas
          </Link>
        </div>
        <form
          className="flex flex-1 flex-col gap-3.5 px-6 pt-[18px] pb-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!church || !canSendQuestion(body)) return;
            ask.mutate({
              churchId: church.churchId,
              category,
              body: body.trim(),
              isAnonymous: anonymous,
              verseRef,
            });
          }}
        >
          <h1 className="m-0 font-display-x text-[36px] leading-[.9] tracking-[-.03em]">Ninguna pregunta es tonta</h1>
          <p className="m-0 text-[15px] leading-[1.45] text-ink/70">
            Un líder de tu iglesia te responderá en pocos días.
          </p>
          {verseRef ? (
            <span className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-semibold">Sobre {verseRef}</span>
          ) : null}
          <label htmlFor="question-body" className="sr-only">
            Tu pregunta
          </label>
          <textarea
            id="question-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={QUESTION_MAX}
            placeholder="¿Qué te gustaría preguntar?"
            className="min-h-[150px] rounded-[22px] bg-white p-[18px] text-[17px] leading-[1.5] placeholder:text-ink/40 focus:outline-2 focus:outline-ink"
          />
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Tema">
            {QUESTION_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={category === c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  "rounded-full px-3 py-2 text-xs font-semibold",
                  category === c.id ? "bg-stage-encuentra" : "bg-white",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 rounded-full bg-white p-1" role="radiogroup" aria-label="Cómo enviarla">
            {[
              { v: true, label: "Anónimo" },
              { v: false, label: "Con mi nombre" },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                role="radio"
                aria-checked={anonymous === o.v}
                onClick={() => setAnonymous(o.v)}
                className={cn(
                  "h-12 rounded-full text-sm font-bold transition-all duration-200",
                  anonymous === o.v ? "bg-ink text-white" : "text-ink/55",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p aria-live="polite" className="m-0 text-[13px] leading-[1.4] text-ink/60">
            {anonymityNote(anonymous)}
          </p>
          <div className="min-h-4 flex-1" />
          {ask.isError ? (
            <p role="alert" className="m-0 text-sm font-semibold text-coral">
              {ask.error.message}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="ink"
            size="lg"
            block
            className="h-[58px]"
            disabled={!canSendQuestion(body)}
            loading={ask.isPending}
          >
            Enviar pregunta
          </Button>
        </form>
      </div>
    </main>
  );
}
