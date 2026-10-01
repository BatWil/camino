"use client";

import { fitTitleStyle } from "@/utils/fit-title";
import { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/feedback/state-view";
import { nextPlanDay } from "@/features/today/domain/next-step";
import { useMyPlans } from "@/features/plans/hooks/use-plans";
import type { MyPlan } from "@/features/plans/data/plan.repository";
import { cn } from "@/utils/cn";
import type { ModuleView, StageView } from "../domain/journey";
import { stageNumber, stageTheme } from "../domain/stages";
import { useJourney } from "../hooks/use-journey";

function moduleHref(m: ModuleView): string | null {
  if (m.kind === "devotional" && m.devotionalId) return `/devocional/?id=${m.devotionalId}`;
  if (m.kind === "plan" && m.planId) return `/plan/?id=${m.planId}`;
  return null;
}

function ModuleRow({ module, plan, accent }: { module: ModuleView; plan?: MyPlan; accent: string }) {
  const href = moduleHref(module);
  const done = module.state === "completed";
  const here = module.state === "current" || module.state === "recommended";
  const next = plan ? nextPlanDay(plan) : null;
  const detail =
    plan && plan.status === "active"
      ? `Día ${next?.dayNumber ?? plan.days.length} de ${plan.days.length} · sigue aquí`
      : module.state === "current"
        ? "Lo empezaste · sigue aquí"
        : module.state === "recommended"
          ? "Tu siguiente paso"
          : null;

  const content = (
    <>
      {done ? (
        <span
          className="flex size-[30px] flex-none items-center justify-center rounded-full text-ink"
          style={{ background: accent }}
        >
          <Check className="size-4" strokeWidth={3} aria-hidden />
        </span>
      ) : here ? (
        <span className="flex size-[30px] flex-none items-center justify-center rounded-full bg-lime shadow-[0_0_0_6px_rgba(198,244,50,.25)]">
          <span className="size-2.5 rounded-full bg-ink" />
        </span>
      ) : (
        <span className="size-[30px] flex-none rounded-full border-2 border-white/30 bg-ink" />
      )}
      <span className="flex flex-1 flex-col gap-[3px]">
        <span className={cn("text-[15px]", done ? "text-paper/60 line-through" : here ? "font-bold" : "text-paper/85")}>
          {module.title}
          {module.optional ? <span className="ml-1.5 text-xs font-normal text-paper/50">(opcional)</span> : null}
        </span>
        {detail && !done ? <span className="text-xs text-lime">{detail}</span> : null}
      </span>
      {href ? (
        <ChevronRight className={cn("size-[18px] flex-none", here ? "text-lime" : "text-paper/40")} aria-hidden />
      ) : null}
    </>
  );

  const className = cn(
    "relative flex items-center gap-3.5",
    here ? "-mx-1.5 my-1 min-h-[62px] rounded-2xl bg-lime/[.12] px-1.5" : "min-h-[46px]",
  );
  return (
    <li>
      {href ? (
        <Link href={href} className={className} aria-current={here ? "step" : undefined}>
          {content}
        </Link>
      ) : (
        <div className={className}>{content}</div>
      )}
    </li>
  );
}

function ExpandedStage({ view, plans }: { view: StageView; plans: MyPlan[] }) {
  const theme = stageTheme(view.stage.key);
  const doneShare = view.modules.length
    ? view.modules.filter((m) => m.state === "completed").length / view.modules.length
    : 0;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="@container flex min-w-0 flex-1 flex-col gap-1">
          <span className="eyebrow">Etapa {stageNumber(view.stage.position)}</span>
          <h2
            className="m-0 font-display-x text-[50px] leading-[.85] tracking-[-.02em]"
            style={fitTitleStyle(view.stage.name, 50)}
          >
            {view.stage.name}
          </h2>
        </div>
        <div
          role="img"
          aria-label={`${view.percent}% completado`}
          className="flex size-[74px] flex-none items-center justify-center rounded-full"
          style={{ background: `conic-gradient(#0D0A26 0 ${view.percent}%, rgba(13,10,38,.15) ${view.percent}% 100%)` }}
        >
          <div
            className="flex size-[58px] items-center justify-center rounded-full font-display-x text-base normal-case"
            style={{ background: theme.color, color: theme.onColor }}
          >
            {view.percent}%
          </div>
        </div>
      </div>
      {view.stage.description ? (
        <p className="m-0 text-[15px] leading-[1.45] font-medium">{view.stage.description}</p>
      ) : null}
      {view.modules.length ? (
        <div className="relative rounded-[22px] bg-ink px-4 py-[18px] text-paper">
          <div
            className="absolute top-[30px] bottom-[30px] left-[30px] w-0.5"
            style={{
              background: `linear-gradient(${theme.color} ${doneShare * 100}%, rgba(255,255,255,.2) ${doneShare * 100}%)`,
            }}
            aria-hidden
          />
          <ol className="relative m-0 flex list-none flex-col p-0" aria-label={`Módulos de ${view.stage.name}`}>
            {view.modules.map((m) => (
              <ModuleRow
                key={m.id}
                module={m}
                accent={theme.color}
                plan={m.planId ? plans.find((p) => p.planId === m.planId) : undefined}
              />
            ))}
          </ol>
        </div>
      ) : (
        <p className="m-0 text-sm font-medium opacity-80">Pronto habrá experiencias para esta etapa.</p>
      )}
    </div>
  );
}

/** Screen 2d · "Mi Camino · estaciones apiladas", interactive. */
export function JourneyMap() {
  const journey = useJourney();
  const plans = useMyPlans();
  const [openId, setOpenId] = useState<string | null>(null);

  if (journey.isPending) {
    return (
      <div className="flex flex-col gap-2 px-3" role="status" aria-label="Cargando tu camino">
        <Skeleton className="h-[74px]" />
        <Skeleton className="h-[360px]" />
        <Skeleton className="h-[74px]" />
      </div>
    );
  }
  if (journey.isError || !journey.data) {
    return (
      <div className="px-3">
        <StateView
          kind="error"
          message="No pudimos cargar tu camino."
          action={
            <Button variant="ink" size="sm" onClick={() => journey.refetch()}>
              Reintentar
            </Button>
          }
        />
      </div>
    );
  }

  const views = journey.data;
  const current = views.find((v) => v.state === "current");
  const expandedId = openId ?? current?.stage.id ?? null;
  const firstUpcoming = views.find((v) => v.state === "upcoming");

  return (
    <ol className="m-0 flex list-none flex-col p-0 px-3" aria-label="Etapas del camino">
      {views.map((view, i) => {
        const theme = stageTheme(view.stage.key);
        const expanded = view.stage.id === expandedId;
        const last = i === views.length - 1;
        const isCurrent = view.state === "current";
        const label =
          view.state === "passed"
            ? null
            : view.stage.id === firstUpcoming?.stage.id
              ? "PRÓXIMA"
              : stageNumber(view.stage.position);

        return (
          <li
            key={view.stage.id}
            className="relative"
            style={{
              background: theme.color,
              color: theme.onColor,
              marginTop: i === 0 ? 0 : expanded ? -18 : views[i - 1]?.stage.id === expandedId ? 10 : -18,
              borderRadius: expanded || last ? 26 : "26px 26px 0 0",
              boxShadow: i === 0 ? undefined : "0 -10px 24px -12px rgba(13,10,38,.3)",
              opacity:
                view.state === "upcoming" && !expanded
                  ? 1 - Math.min(0.2, (view.stage.position - (current?.stage.position ?? 0) - 1) * 0.05)
                  : 1,
            }}
            aria-current={isCurrent ? "step" : undefined}
          >
            {isCurrent ? (
              <span
                className="pointer-events-none absolute -top-[30px] right-[18px] z-10 -rotate-6 font-hand text-[26px] text-ink"
                aria-hidden
              >
                estás aquí ↓
              </span>
            ) : null}
            {expanded ? (
              <div className="px-5 pt-[22px] pb-6">
                <ExpandedStage view={view} plans={plans.data ?? []} />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setOpenId(view.stage.id)}
                aria-expanded={false}
                className={cn(
                  "flex w-full items-center justify-between px-5 pt-[18px] text-left",
                  last ? "pb-[22px]" : "pb-[34px]",
                )}
              >
                <span className="font-display-x text-[22px]">{view.stage.name}</span>
                {view.state === "passed" ? (
                  <span
                    className="flex size-[30px] items-center justify-center rounded-full bg-ink"
                    style={{ color: theme.color }}
                    aria-label="Etapa recorrida"
                  >
                    <Check className="size-4" strokeWidth={3} aria-hidden />
                  </span>
                ) : (
                  <span className="font-mono text-[11px] font-semibold">{label}</span>
                )}
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}
