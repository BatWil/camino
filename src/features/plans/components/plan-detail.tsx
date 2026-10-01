"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/feedback/state-view";
import { nextPlanDay } from "@/features/today/domain/next-step";
import { AppError } from "@/types/result";
import { cn } from "@/utils/cn";
import { fitTitleStyle } from "@/utils/fit-title";
import { onPlanColor } from "../domain/plans";
import { useMyPlans, usePlan, useStartPlan } from "../hooks/use-plans";

const PREVIEW_DAYS = 3;

/** Screen 5c · Plan · detalle. */
export function PlanDetail({ id }: { id: string | null }) {
  const plan = usePlan(id);
  const mine = useMyPlans();
  const start = useStartPlan();
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  if (!id || (plan.isSuccess && !plan.data)) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] items-center px-3">
        <StateView
          kind="empty"
          title="Este plan no está disponible"
          message="Puede que ya no esté publicado."
          action={
            <Link href="/planes" className="font-semibold text-violet">
              Ver planes
            </Link>
          }
        />
      </main>
    );
  }
  if (plan.isPending || mine.isPending) {
    return (
      <main className="min-h-dvh bg-paper px-4 pt-16" role="status" aria-label="Cargando plan">
        <div className="mx-auto flex max-w-[600px] flex-col gap-3">
          <Skeleton className="h-52" />
          <Skeleton className="h-72" />
        </div>
      </main>
    );
  }
  if (plan.isError || !plan.data) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] items-center px-3">
        <StateView
          kind="error"
          action={
            <Button variant="ink" size="sm" onClick={() => plan.refetch()}>
              Reintentar
            </Button>
          }
        />
      </main>
    );
  }

  const p = plan.data;
  const text = onPlanColor(p.color);
  const enrollment = (mine.data ?? []).find((m) => m.planId === p.id && m.status === "active");
  const finished = (mine.data ?? []).some((m) => m.planId === p.id && m.status === "completed");
  const done = new Set(enrollment?.completedDays ?? []);
  const next = enrollment ? nextPlanDay(enrollment) : null;
  const days = showAll ? p.days : p.days.slice(0, PREVIEW_DAYS);
  const startError =
    start.error instanceof AppError ? start.error.message : start.error ? "No pudimos empezar el plan." : null;

  const begin = () => {
    start.mutate(p.id, {
      onSuccess: (userPlanId) => {
        const first = p.days[0];
        if (first) router.push(`/devocional/?id=${first.devotional.id}&plan=${userPlanId}`);
      },
    });
  };

  return (
    <main className="pt-safe min-h-dvh" style={{ background: p.color, color: text }}>
      <div className="mx-auto flex min-h-dvh max-w-[600px] flex-col">
        <div className="px-5 py-2">
          <Link
            href="/planes"
            aria-label="Volver a planes"
            className="flex size-10 items-center justify-center rounded-full bg-white/20"
          >
            <ArrowLeft className="size-[18px]" aria-hidden />
          </Link>
        </div>
        <header className="@container flex flex-col gap-3.5 px-6 pt-6 pb-7">
          <span className="font-mono text-[11px] font-semibold tracking-[.1em]">
            PLAN · {p.days.length} DÍAS · {p.minutes_per_day} MIN/DÍA
          </span>
          <h1 className="m-0 font-display-x leading-[.88] tracking-[-.03em]" style={fitTitleStyle(p.title, 42)}>
            {p.title}
          </h1>
          <p className="m-0 text-base leading-normal">{p.summary}</p>
          {finished ? <span className="-rotate-3 self-start font-hand text-[26px]">ya lo terminaste ✦</span> : null}
        </header>

        <section
          className="flex flex-1 flex-col gap-2 rounded-t-[32px] bg-paper px-4 pt-6 text-ink"
          style={{ paddingBottom: "calc(var(--safe-bottom) + 30px)" }}
          aria-label="Días del plan"
        >
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {days.map((d) => {
              const isDone = done.has(d.dayNumber);
              const isNext = next?.dayNumber === d.dayNumber || (!enrollment && d.dayNumber === 1);
              const row = (
                <>
                  <span
                    className={cn(
                      "flex size-10 flex-none items-center justify-center rounded-xl font-display font-black",
                      isDone ? "bg-ink text-lime" : isNext ? "bg-ink text-lime" : "bg-[#F1EEE6]",
                    )}
                  >
                    {isDone ? <Check className="size-4" strokeWidth={3} aria-label="Hecho" /> : d.dayNumber}
                  </span>
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="text-[15px] font-bold">{d.devotional.title}</span>
                    <span className="text-xs text-ink/55">{d.devotional.scriptureRef}</span>
                  </span>
                </>
              );
              return (
                <li key={d.dayNumber}>
                  {enrollment ? (
                    <Link
                      href={`/devocional/?id=${d.devotional.id}&plan=${enrollment.userPlanId}`}
                      className="flex items-center gap-3.5 rounded-[20px] bg-white p-3"
                    >
                      {row}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3.5 rounded-[20px] bg-white p-3">{row}</div>
                  )}
                </li>
              );
            })}
          </ol>
          {!showAll && p.days.length > PREVIEW_DAYS ? (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="self-start px-3 py-1 text-[13px] font-semibold text-ink/55"
            >
              + {p.days.length - PREVIEW_DAYS} días más
            </button>
          ) : null}

          {startError ? (
            <p role="alert" className="m-0 text-sm font-semibold text-coral">
              {startError}
            </p>
          ) : null}
          {enrollment && next ? (
            <Link
              href={`/devocional/?id=${next.devotional.id}&plan=${enrollment.userPlanId}`}
              className="mt-2 flex h-[58px] items-center justify-center rounded-full bg-ink text-base font-bold text-white"
            >
              Continuar · Día {next.dayNumber}
            </Link>
          ) : (
            <Button variant="ink" size="lg" block className="mt-2 h-[58px]" loading={start.isPending} onClick={begin}>
              {finished ? "Hacerlo de nuevo" : "Empezar plan"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="md"
            block
            className="h-[52px] border-[1.5px] border-ink/20 text-sm font-semibold"
            onClick={() => setNote("Muy pronto podrás invitar a alguien de tu grupo a hacerlo contigo.")}
          >
            Hacerlo con un amigo
          </Button>
          <p aria-live="polite" className="m-0 min-h-5 text-center text-[13px] text-ink/60">
            {note ?? ""}
          </p>
        </section>
      </div>
    </main>
  );
}
