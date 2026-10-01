"use client";

import { gentleWarning, success } from "@/lib/native/haptics";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/feedback/state-view";
import { bookByCode } from "@/features/bible/domain/books";
import { cn } from "@/utils/cn";
import { buildRound, clock, feedback, finishMessage, LETTERS, type QuizQuestion } from "../domain/quiz";
import { useQuizBest, useQuizBooks, useQuizQuestions, useSaveAttempt } from "../hooks/use-quiz";

const ROUND = 20;

function bookName(code: string) {
  return bookByCode(code)?.name ?? code;
}

function BookPicker() {
  const router = useRouter();
  const books = useQuizBooks();
  return (
    <main className="pt-safe pb-safe min-h-dvh bg-stage-encuentra">
      <div className="mx-auto flex max-w-[600px] flex-col gap-3 px-3 pb-8">
        <div className="px-2 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Cerrar"
            className="flex size-10 items-center justify-center rounded-full bg-white/50"
          >
            <X className="size-[18px]" aria-hidden />
          </button>
        </div>
        <h1 className="m-0 px-3 font-display-x text-[40px] leading-[.86] tracking-[-.03em]">Quiz Bíblico</h1>
        <p className="m-0 px-3 text-[15px] leading-[1.45]">Practica a tu ritmo. Tus resultados son solo para ti.</p>
        {books.isPending ? <Skeleton className="h-20 rounded-[22px] bg-white/40" /> : null}
        {books.data && !books.data.length ? (
          <StateView kind="empty" title="Aún no hay preguntas" message="Pronto habrá libros para practicar." />
        ) : null}
        {books.data?.map((b) => (
          <Link
            key={b.book}
            href={`/quiz/?libro=${b.book}`}
            className="flex items-center justify-between rounded-[22px] bg-white px-[18px] py-4"
          >
            <span className="flex flex-col gap-1">
              <span className="font-display-x text-xl">{bookName(b.book)}</span>
              <span className="text-xs text-ink/60">{b.count} preguntas</span>
            </span>
            <span className="flex h-10 items-center rounded-full bg-ink px-4 text-[13px] font-semibold text-white">
              Practicar
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}

function Round({ book, questions }: { book: string; questions: QuizQuestion[] }) {
  const router = useRouter();
  const best = useQuizBest(book);
  const save = useSaveAttempt();
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const round = buildRound(questions, ROUND, seed);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const done = index >= round.length;

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [done]);

  const q = round[index];
  const fb = q && picked !== null ? feedback(q, picked) : null;
  const name = bookName(book);

  const next = () => {
    const nextIndex = index + 1;
    setPicked(null);
    setIndex(nextIndex);
    if (nextIndex >= round.length) save.mutate({ book, correct, total: round.length, seconds: elapsed });
  };

  const restart = () => {
    setSeed(Math.floor(Math.random() * 2 ** 31));
    setIndex(0);
    setPicked(null);
    setCorrect(0);
    setElapsed(0);
  };

  return (
    <main className="pt-safe pb-safe flex min-h-dvh flex-col bg-stage-encuentra text-ink">
      <div className="mx-auto flex w-full max-w-[600px] flex-1 flex-col">
        <div className="flex items-center justify-between px-5 py-2">
          <button
            type="button"
            onClick={() => router.replace("/quiz")}
            aria-label="Cerrar"
            className="flex size-10 items-center justify-center rounded-full bg-white/50"
          >
            <X className="size-[18px]" aria-hidden />
          </button>
          <span className="font-mono text-[11px] font-semibold tracking-[.1em] uppercase">
            {name} · {Math.min(index + 1, round.length)} / {round.length}
          </span>
          <span
            className="rounded-full bg-ink px-3 py-2 font-mono text-xs font-semibold text-stage-encuentra"
            aria-label="Tiempo"
          >
            {clock(elapsed)}
          </span>
        </div>
        <div className="px-6 pt-2.5">
          <div
            className="h-1.5 rounded-[3px]"
            style={{
              background: `linear-gradient(90deg,#0D0A26 ${(Math.min(index, round.length) / round.length) * 100}%,rgba(13,10,38,.15) 0)`,
            }}
            aria-hidden
          />
        </div>

        {done ? (
          <div className="flex flex-1 flex-col gap-4 px-6 pt-10 pb-6">
            <span className="eyebrow">Práctica terminada</span>
            <h1 className="m-0 font-display-x text-[56px] leading-none">
              {correct}/{round.length}
            </h1>
            <p className="m-0 text-lg font-semibold">{finishMessage(correct, round.length)}</p>
            <div className="flex-1" />
            <Button variant="ink" size="lg" block className="h-[58px]" onClick={restart}>
              Practicar otra vez
            </Button>
            <Link href="/quiz" className="text-center text-sm font-semibold">
              Elegir otro libro
            </Link>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-3 px-6 pt-[34px] pb-6">
            <span className="font-mono text-[11px] font-semibold tracking-[.1em] uppercase">
              Pregunta {index + 1} · {name} {q.chapter}
            </span>
            <h2 className="m-0 mb-3.5 text-[26px] leading-[1.2] font-bold">{q.question}</h2>
            <div className="flex flex-col gap-3" role="radiogroup" aria-label="Respuestas">
              {q.options.map((opt, i) => {
                const show = picked !== null;
                const right = i === q.answer_index;
                const sel = picked === i;
                return (
                  <button
                    key={opt}
                    type="button"
                    role="radio"
                    aria-checked={sel}
                    disabled={show}
                    onClick={() => {
                      setPicked(i);
                      if (i === q.answer_index) {
                        success();
                        setCorrect((c) => c + 1);
                      } else gentleWarning();
                    }}
                    className={cn(
                      "flex min-h-[58px] items-center gap-3 rounded-[18px] border-2 px-4 text-left text-[15px] font-semibold transition-all duration-200",
                      show && right ? "bg-ink text-stage-encuentra" : sel ? "bg-coral" : "bg-white",
                      sel ? "border-ink" : "border-transparent",
                      show && right && "animate-pop",
                      sel && !right && "animate-nudge",
                    )}
                  >
                    <span className="flex size-[30px] flex-none items-center justify-center rounded-full bg-ink/[.08] font-display text-[13px] font-black">
                      {LETTERS[i]}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
            <p aria-live="polite" className="m-0 min-h-9 origin-left -rotate-2 font-hand text-[28px]">
              {fb ? (
                <span key={index} className="animate-rise inline-block">
                  {fb.text}
                </span>
              ) : null}
            </p>
            <div className="flex-1" />
            {picked !== null ? (
              <Button variant="ink" size="lg" block className="h-[58px]" onClick={next}>
                {index + 1 >= round.length ? "Ver resultado" : "Siguiente"}
              </Button>
            ) : null}
            <div className="flex items-center justify-between rounded-[22px] bg-ink px-[18px] py-4 text-paper">
              <span className="text-sm font-semibold">
                Tu práctica · {name}
                {best.data ? ` · mejor ${best.data.correct}/${best.data.total}` : ""}
              </span>
              <span className="font-display text-lg font-black text-stage-encuentra">
                {correct}/{index + (picked !== null ? 1 : 0)}
              </span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/** Screen 8e · Quiz Bíblico · práctica. No rankings: scores are private. */
export function QuizScreen() {
  const book = useSearchParams().get("libro");
  const questions = useQuizQuestions(book);
  if (!book) return <BookPicker />;
  if (questions.isPending) {
    return (
      <main className="min-h-dvh bg-stage-encuentra p-6">
        <Skeleton className="mt-16 h-64 rounded-[22px] bg-white/40" />
      </main>
    );
  }
  if (!questions.data?.length) {
    return (
      <main className="pt-safe flex min-h-dvh items-center bg-stage-encuentra px-5">
        <StateView kind="empty" title="Sin preguntas para este libro" />
      </main>
    );
  }
  return <Round key={book} book={book} questions={questions.data} />;
}
