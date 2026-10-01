"use client";

import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTodayStep } from "../hooks/use-today";

const stripes = "repeating-linear-gradient(135deg,#FFE7A8 0 10px,#FFDF8F 10px 20px)";

/** "HOY · DEVOCIONAL · 5 MIN" card of screen 2c — the person's next step today. */
export function TodayCard() {
  const { step, isPending, isError } = useTodayStep();
  if (isPending) return <Skeleton className="h-[320px] rounded-[30px]" />;
  if (isError || !step) return null;

  if (step.kind === "explore" || step.kind === "plan") {
    const href = step.kind === "plan" ? `/plan/?id=${step.planId}` : "/planes";
    return (
      <section className="overflow-hidden rounded-[30px] bg-white" aria-labelledby="today-title">
        <div className="h-[110px]" style={{ background: stripes }} aria-hidden />
        <div className="flex flex-col gap-2.5 px-5 pt-[18px] pb-5">
          <span className="eyebrow text-ink/50">Hoy · tu siguiente paso</span>
          <h2 id="today-title" className="m-0 text-[21px] leading-[1.15] font-bold">
            {step.kind === "plan" ? step.title : "Elige un plan para esta semana"}
          </h2>
          <ButtonLink href={href} variant="ink" size="sm" className="h-11 self-start px-[22px] text-sm">
            {step.kind === "plan" ? "Ver plan" : "Explorar planes"}
          </ButtonLink>
        </div>
      </section>
    );
  }

  const devotional = step.devotional;
  const href =
    step.kind === "plan_day"
      ? `/devocional/?id=${devotional.id}&plan=${step.userPlanId}`
      : `/devocional/?id=${devotional.id}`;
  const progress = Math.round(step.progress * 100);
  const tag = step.kind === "plan_day" ? `DÍA ${step.dayNumber}` : null;
  const label = step.kind === "plan_day" ? step.planTitle : "Devocional";
  const cta = step.kind === "devotional" && !step.started ? "Empezar" : "Continuar";

  return (
    <section className="overflow-hidden rounded-[30px] bg-white" aria-labelledby="today-title">
      <div className="flex h-[150px] items-start justify-end p-3.5" style={{ background: stripes }}>
        {tag ? (
          <span className="rounded-full bg-ink px-2.5 py-[5px] text-[11px] font-semibold text-white">{tag}</span>
        ) : null}
      </div>
      <div className="flex flex-col gap-2.5 px-5 pt-[18px] pb-5">
        <span className="eyebrow text-ink/50">
          Hoy · {label} · {devotional.minutes} min
        </span>
        <h2 id="today-title" className="m-0 text-[21px] leading-[1.15] font-bold">
          {devotional.title}
        </h2>
        <div className="flex items-center gap-3">
          <ButtonLink href={href} variant="ink" size="sm" className="h-11 px-[22px] text-sm">
            {cta}
          </ButtonLink>
          <div
            className="h-[5px] flex-1 rounded-[3px]"
            role="progressbar"
            aria-label={step.kind === "plan_day" ? "Avance del plan" : "Avance del devocional"}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{ background: `linear-gradient(90deg,#FFC83D ${progress}%,#EEE ${progress}%)` }}
          />
        </div>
      </div>
    </section>
  );
}
