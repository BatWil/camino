"use client";

import { ButtonLink } from "@/components/ui/button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/feedback/state-view";
import { categoryLabel } from "../domain/questions";
import { useFaq, useMyQuestions } from "../hooks/use-questions";

/** My questions (with private answers) + the church's published FAQ. */
export function MyQuestionsScreen() {
  const mine = useMyQuestions();
  const faq = useFaq();

  return (
    <div className="flex flex-col gap-3">
      <ScreenHeader title="Preguntas" />
      <div className="px-3">
        <ButtonLink href="/pregunta" variant="ink" size="lg" block className="h-[58px]">
          Hacer una pregunta
        </ButtonLink>
      </div>

      <section aria-labelledby="mis-preguntas" className="flex flex-col gap-2.5 px-3">
        <h2 id="mis-preguntas" className="m-0 px-3 pt-3 text-[17px] font-bold">
          Mis preguntas
        </h2>
        {mine.isPending ? <Skeleton className="h-24 rounded-[22px]" /> : null}
        {mine.isError ? <StateView kind="error" message={mine.error.message} /> : null}
        {mine.data && !mine.data.length ? (
          <p className="m-0 rounded-[22px] bg-white px-[18px] py-4 text-sm text-ink/60">
            Aún no has preguntado nada. Puedes hacerlo de forma anónima.
          </p>
        ) : null}
        {mine.data?.map((q) => (
          <article key={q.id} className="flex flex-col gap-2 rounded-[22px] bg-white px-[18px] py-4">
            <span className="flex items-center justify-between">
              <span className="eyebrow text-ink/50">
                {categoryLabel(q.category)} · {q.is_anonymous ? "Anónima" : "Con mi nombre"}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${q.answer ? "bg-stage-crece" : "bg-paper"}`}
              >
                {q.answer ? "Respondida" : "En espera"}
              </span>
            </span>
            <p className="m-0 text-[15px] leading-[1.45] font-semibold">{q.body}</p>
            {q.answer ? (
              <p className="m-0 rounded-2xl bg-lilac p-3.5 text-[15px] leading-[1.5] whitespace-pre-line">{q.answer}</p>
            ) : null}
          </article>
        ))}
      </section>

      {faq.data?.length ? (
        <section aria-labelledby="faq" className="flex flex-col gap-2.5 px-3">
          <h2 id="faq" className="m-0 px-3 pt-3 text-[17px] font-bold">
            Preguntas frecuentes de tu iglesia
          </h2>
          {faq.data.map((f) => (
            <details key={f.id} className="rounded-[22px] bg-white px-[18px] py-4">
              <summary className="cursor-pointer text-[15px] font-semibold">{f.question}</summary>
              <p className="mt-2.5 mb-0 text-[15px] leading-[1.5] whitespace-pre-line text-ink/80">{f.answer}</p>
            </details>
          ))}
        </section>
      ) : null}
    </div>
  );
}
