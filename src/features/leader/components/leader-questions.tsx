"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryLabel } from "@/features/questions/domain/questions";
import { useQuestionInbox } from "@/features/questions/hooks/use-questions";
import type { InboxQuestion } from "@/features/questions/data/questions.repository";
import { useLeaderChurch } from "../hooks/use-leader";
import { LeaderNoChurch } from "./leader-dashboard";

function QuestionCard({ q, churchId }: { q: InboxQuestion; churchId: string }) {
  const { answer } = useQuestionInbox(churchId);
  const [body, setBody] = useState(q.answer ?? "");
  const [faq, setFaq] = useState(q.publish_faq ?? false);
  const [editing, setEditing] = useState(!q.answer);
  return (
    <article className="flex flex-col gap-3 rounded-3xl bg-white p-[22px]">
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span className="eyebrow text-ink/50">
          {categoryLabel(q.category)} · {q.is_anonymous ? "Anónimo" : q.author_name}
          {q.verse_ref ? ` · ${q.verse_ref}` : ""}
        </span>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${q.answer ? "bg-stage-crece" : "bg-coral"}`}>
          {q.answer ? "Respondida" : "Nueva"}
        </span>
      </span>
      <p className="m-0 text-base leading-[1.45] font-semibold">{q.body}</p>
      {editing ? (
        <>
          <label className="sr-only" htmlFor={`a-${q.id}`}>
            Tu respuesta
          </label>
          <textarea
            id={`a-${q.id}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={4000}
            rows={4}
            placeholder="Responde con calma y cariño…"
            className="rounded-2xl border-[1.5px] border-ink/15 p-3.5 text-[15px] focus:border-ink focus:outline-none"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={faq} onChange={(e) => setFaq(e.target.checked)} />
            Publicar como pregunta frecuente (sin nombre de quien preguntó)
          </label>
          <Button
            variant="ink"
            size="sm"
            className="self-start"
            disabled={body.trim().length < 2}
            loading={answer.isPending && answer.variables?.id === q.id}
            onClick={() =>
              answer.mutate({ id: q.id, body: body.trim(), publishFaq: faq }, { onSuccess: () => setEditing(false) })
            }
          >
            Enviar respuesta
          </Button>
        </>
      ) : (
        <>
          <p className="m-0 rounded-2xl bg-lilac p-3.5 text-[15px] leading-[1.5] whitespace-pre-line">
            {q.answer ?? body}
          </p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="self-start text-[13px] font-semibold text-violet"
          >
            Editar respuesta
          </button>
        </>
      )}
    </article>
  );
}

/** Preguntas: the leader answers; anonymous authors are never revealed (enforced by leader_questions()). */
export function LeaderQuestions() {
  const { churchId, isPending } = useLeaderChurch();
  const { inbox } = useQuestionInbox(churchId);
  if (!isPending && !churchId) return <LeaderNoChurch />;
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 font-display-x text-[40px] leading-[.9] tracking-[-.02em]">Preguntas</h1>
        <p className="m-0 text-sm text-ink/60">
          Las preguntas anónimas no muestran a nadie quién las hizo — ni a ti ni a los administradores. La respuesta
          llega solo a quien preguntó.
        </p>
      </div>
      {inbox.isPending ? <Skeleton className="h-40 rounded-3xl" /> : null}
      {inbox.data && !inbox.data.length ? (
        <p className="m-0 rounded-3xl bg-white p-[22px] text-sm text-ink/60">Aún no hay preguntas.</p>
      ) : null}
      <div className="grid gap-3 xl:grid-cols-2">
        {inbox.data?.map((q) => (
          <QuestionCard key={q.id} q={q} churchId={churchId!} />
        ))}
      </div>
    </>
  );
}
