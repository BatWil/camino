"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Celebration } from "@/components/feedback/celebration";
import { StateView } from "@/components/feedback/state-view";
import { analytics } from "@/lib/analytics";
import type { DevotionalStep } from "@/lib/supabase/database.types";
import { useMyPlans } from "@/features/plans/hooks/use-plans";
import { useAppStore } from "@/stores/app-store";
import { AppError } from "@/types/result";
import { cn } from "@/utils/cn";
import { fitTitleStyle } from "@/utils/fit-title";
import type { CompletionResult, Devotional } from "../data/devotional.repository";
import { STEP_LABELS, currentStepNumber, nextReadingScale } from "../domain/steps";
import { useCompleteDevotional, useDevotional, useSaveDevotionalProgress } from "../hooks/use-devotional";

/** Marks a step as done once its section has been on screen for a moment. */
function useSeen(onSeen: () => void) {
  const ref = useRef<HTMLElement | null>(null);
  const cb = useRef(onSeen);
  useEffect(() => {
    cb.current = onSeen;
  }, [onSeen]);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) timer = setTimeout(() => cb.current(), 1200);
        else clearTimeout(timer);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      clearTimeout(timer);
      io.disconnect();
    };
  }, []);
  return ref;
}

function DevotionalBody({
  devotional,
  initialSteps,
  initialAnswer,
  completed,
  userPlanId,
  dayNumber,
}: {
  devotional: Devotional;
  initialSteps: DevotionalStep[];
  initialAnswer: string;
  completed: boolean;
  userPlanId: string | null;
  dayNumber: number | null;
}) {
  const router = useRouter();
  const [steps, setSteps] = useState<DevotionalStep[]>(completed ? STEP_LABELS.map((s) => s.step) : initialSteps);
  const [answer, setAnswer] = useState(initialAnswer);
  const [result, setResult] = useState<CompletionResult | null>(null);
  const scale = useAppStore((s) => s.preferences.bibleFontScale);
  const setPreferences = useAppStore((s) => s.setPreferences);
  const save = useSaveDevotionalProgress(devotional.id);
  const complete = useCompleteDevotional(devotional.id, userPlanId);
  const started = useRef(initialSteps.length > 0 || completed);
  const savedAnswer = useRef(initialAnswer);

  const stepsRef = useRef(steps);
  const updateSteps = useCallback((next: DevotionalStep[]) => {
    stepsRef.current = next;
    setSteps(next);
  }, []);

  const mark = useCallback(
    (step: DevotionalStep) => {
      if (completed || stepsRef.current.includes(step)) return;
      const next = [...stepsRef.current, step];
      updateSteps(next);
      save.mutate({ steps: next, answer: null });
      if (!started.current) {
        started.current = true;
        analytics.track("devotional_started", { devotional_id: devotional.id });
      }
    },
    [completed, save, devotional.id, updateSteps],
  );

  const readRef = useSeen(useCallback(() => mark("read"), [mark]));
  const reflectRef = useSeen(useCallback(() => mark("reflect"), [mark]));
  const thinkRef = useSeen(useCallback(() => mark("think"), [mark]));
  const prayRef = useSeen(useCallback(() => mark("pray"), [mark]));

  const persistAnswer = () => {
    const text = answer.trim();
    if (completed || !text || text === savedAnswer.current) return;
    savedAnswer.current = text;
    const current = stepsRef.current;
    const next: DevotionalStep[] = current.includes("write") ? current : [...current, "write"];
    updateSteps(next);
    save.mutate({ steps: next, answer: text });
  };

  const current = currentStepNumber(steps);
  const textStyle = useMemo(() => ({ fontSize: `${scale}em` }), [scale]);
  const error =
    complete.error instanceof AppError ? complete.error.message : complete.error ? "No pudimos completarlo." : null;

  return (
    <main className="pt-safe pb-safe min-h-dvh bg-cream text-ink">
      <div className="mx-auto max-w-[600px]">
        <div className="flex items-center justify-between px-5 py-2">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.replace("/inicio"))}
            aria-label="Cerrar devocional"
            className="flex size-10 items-center justify-center rounded-full bg-white"
          >
            <X className="size-[18px]" aria-hidden />
          </button>
          <span className="font-mono text-[11px] font-semibold tracking-[.1em]" aria-label={`Paso ${current} de 6`}>
            {current} / 6
          </span>
          <button
            type="button"
            onClick={() => setPreferences({ bibleFontScale: nextReadingScale(scale) })}
            aria-label="Cambiar tamaño del texto"
            className="flex size-10 items-center justify-center rounded-full bg-white text-sm font-semibold"
          >
            Aa
          </button>
        </div>

        <ol
          className="m-0 flex list-none gap-1.5 overflow-x-auto px-5 pt-2.5 [scrollbar-width:none]"
          aria-label="Pasos del devocional"
        >
          {STEP_LABELS.map(({ step, label }, i) => {
            const done = steps.includes(step);
            const isCurrent = !done && i + 1 === current;
            return (
              <li
                key={step}
                className={cn(
                  "flex-none rounded-full px-[11px] py-[7px] font-mono text-[10px] font-semibold uppercase",
                  done ? "bg-ink text-stage-encuentra" : isCurrent ? "bg-stage-encuentra" : "border border-ink/20",
                )}
              >
                {done ? "✓ " : ""}
                {label}
                <span className="sr-only">{done ? " (hecho)" : isCurrent ? " (actual)" : ""}</span>
              </li>
            );
          })}
        </ol>

        <header className="@container flex flex-col gap-3 px-6 pt-[26px] pb-5">
          {dayNumber ? <span className="font-hand text-[28px] leading-none text-coral">día {dayNumber}</span> : null}
          <h1
            className="m-0 font-display-x leading-[.92] tracking-[-.02em]"
            style={fitTitleStyle(devotional.title, 36)}
          >
            {devotional.title}
          </h1>
          <span className="text-sm font-medium text-ink/60">
            {devotional.minutes} min · {devotional.scripture_ref}
          </span>
        </header>

        <section
          ref={readRef}
          className="mx-4 flex flex-col gap-2.5 rounded-[26px] bg-white p-[22px]"
          aria-labelledby="dv-read"
        >
          <span id="dv-read" className="eyebrow text-stage-sirve">
            Leer · {devotional.scripture_ref}
          </span>
          <p className="m-0 font-serif text-lg leading-[1.55] italic" style={textStyle}>
            “{devotional.scripture_text}”
          </p>
          {devotional.scripture_version ? (
            <span className="text-xs text-ink/50">{devotional.scripture_version}</span>
          ) : null}
        </section>

        <section ref={reflectRef} className="flex flex-col gap-2.5 px-6 pt-[22px]" aria-labelledby="dv-reflect">
          <span id="dv-reflect" className="eyebrow text-ink/50">
            Reflexionar
          </span>
          <p className="m-0 text-[17px] leading-[1.55]" style={textStyle}>
            {devotional.reflection}
          </p>
        </section>

        <section ref={thinkRef} className="flex flex-col gap-3 px-6 pt-[22px]" aria-labelledby="dv-think">
          <span className="eyebrow text-ink/50">Pensar</span>
          <label id="dv-think" htmlFor="dv-answer" className="text-[22px] leading-[1.2] font-bold">
            {devotional.question}
          </label>
          <textarea
            id="dv-answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onBlur={persistAnswer}
            readOnly={completed}
            maxLength={4000}
            placeholder="Escribe lo que estás pensando…"
            className="min-h-[120px] w-full resize-y rounded-[20px] border-[1.5px] border-ink/12 bg-white p-4 text-base leading-normal placeholder:text-ink/40 focus:border-ink focus:outline-none"
          />
          <span className="flex items-center gap-2 text-[13px] font-semibold text-ink/60">
            <Lock className="size-3.5" aria-hidden />
            Solo tú puedes leer tu respuesta
          </span>
        </section>

        <section
          ref={prayRef}
          className="mx-4 mt-[22px] flex flex-col gap-2.5 rounded-[26px] bg-violet p-[22px] text-white"
          aria-labelledby="dv-pray"
        >
          <span id="dv-pray" className="eyebrow text-lime">
            Oración guiada
          </span>
          <p className="m-0 text-base leading-[1.55]" style={textStyle}>
            {devotional.prayer}
          </p>
        </section>

        <section className="mx-4 mt-3 flex flex-col gap-2 rounded-[26px] bg-coral p-[22px]" aria-labelledby="dv-act">
          <span id="dv-act" className="eyebrow">
            Actuar · Reto de hoy
          </span>
          <p className="m-0 text-lg leading-[1.3] font-bold">{devotional.action}</p>
        </section>

        <div className="flex flex-col gap-2 px-4 pt-[22px] pb-9">
          {error ? (
            <p role="alert" className="m-0 text-center text-sm font-semibold text-coral">
              {error}
            </p>
          ) : null}
          {completed && !result ? (
            <div
              className="flex h-[60px] items-center justify-center rounded-full bg-ink/10 text-base font-bold"
              role="status"
            >
              ✓ Completado
            </div>
          ) : (
            <Button
              variant="ink"
              size="lg"
              block
              className="h-[60px]"
              loading={complete.isPending}
              onClick={() =>
                complete.mutate(answer.trim() || null, {
                  onSuccess: (r) => {
                    updateSteps(STEP_LABELS.map((s) => s.step));
                    setResult(r);
                  },
                })
              }
            >
              Completar devocional
            </Button>
          )}
        </div>
      </div>

      {result ? (
        <Celebration
          eyebrow={
            result.stageAdvanced ? "Nueva etapa" : result.planCompleted ? "Plan completado" : "Devocional completado"
          }
          title={
            result.stageAdvanced && result.stageName
              ? result.stageName
              : result.planCompleted
                ? "¡Lo terminaste!"
                : "Un paso más"
          }
          message={
            result.stageAdvanced
              ? "Mira cuánto has recorrido. Tu camino sigue, a tu ritmo."
              : result.planCompleted
                ? "Terminaste este plan. Lo que sembraste estos días sigue creciendo."
                : "Hoy apartaste tiempo para Dios. Eso cuenta."
          }
          actions={
            <>
              <ButtonLink href="/inicio" variant="ink" size="lg" block replace>
                Volver al inicio
              </ButtonLink>
              <ButtonLink href="/camino" variant="ghost" size="md" block className="border-[1.5px] border-ink" replace>
                Ver mi camino
              </ButtonLink>
            </>
          }
        />
      ) : null}
    </main>
  );
}

/** Screen 2e · /devocional/?id=…[&plan=…] */
export function DevotionalScreen({ id, userPlanId }: { id: string | null; userPlanId: string | null }) {
  const { detail, progress } = useDevotional(id);
  const myPlans = useMyPlans();

  if (!id) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] items-center px-3">
        <StateView
          kind="empty"
          title="Este devocional no existe"
          message="Vuelve al inicio para seguir tu camino."
          action={
            <ButtonLink href="/inicio" variant="ink" size="sm">
              Ir al inicio
            </ButtonLink>
          }
        />
      </main>
    );
  }
  if (detail.isPending || progress.isPending || (userPlanId && myPlans.isPending)) {
    return (
      <main className="min-h-dvh bg-cream px-4 pt-16" role="status" aria-label="Cargando devocional">
        <div className="mx-auto flex max-w-[600px] flex-col gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-40" />
          <Skeleton className="h-56" />
        </div>
      </main>
    );
  }
  if (detail.isError || progress.isError) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] items-center px-3">
        <StateView
          kind="error"
          action={
            <Button
              variant="ink"
              size="sm"
              onClick={() => {
                void detail.refetch();
                void progress.refetch();
              }}
            >
              Reintentar
            </Button>
          }
        />
      </main>
    );
  }
  if (!detail.data) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] items-center px-3">
        <StateView
          kind="empty"
          title="Este devocional no está disponible"
          message="Puede que ya no esté publicado."
          action={
            <Link href="/inicio" className="font-semibold text-violet">
              Ir al inicio
            </Link>
          }
        />
      </main>
    );
  }

  const plan = userPlanId ? myPlans.data?.find((p) => p.userPlanId === userPlanId) : undefined;
  const dayNumber = plan?.days.find((d) => d.devotional.id === id)?.dayNumber ?? null;

  return (
    <DevotionalBody
      key={detail.data.id}
      devotional={detail.data}
      initialSteps={progress.data?.completed_steps ?? []}
      initialAnswer={progress.data?.answer ?? ""}
      completed={
        progress.data?.status === "completed" &&
        !(plan && plan.status === "active" && dayNumber !== null && !plan.completedDays.includes(dayNumber))
      }
      userPlanId={plan?.status === "active" ? plan.userPlanId : null}
      dayNumber={dayNumber}
    />
  );
}
