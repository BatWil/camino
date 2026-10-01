"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/feedback/state-view";
import { useCurrentStage } from "@/features/journey/hooks/use-current-stage";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { nextPlanDay } from "@/features/today/domain/next-step";
import { cn } from "@/utils/cn";
import { fitTitleStyle } from "@/utils/fit-title";
import type { Plan } from "../data/plan.repository";
import { CATEGORY_LABEL, filterPlans, matchesSearch, onPlanColor, type LibraryTab } from "../domain/plans";
import { useMyPlans, usePlanLibrary } from "../hooks/use-plans";

function PlanCard({ plan, days }: { plan: Plan; days: number }) {
  return (
    <Link
      href={`/plan/?id=${plan.id}`}
      className="@container flex h-[210px] flex-col justify-between rounded-[26px] p-4"
      style={{ background: plan.color, color: onPlanColor(plan.color) }}
    >
      <span className="font-mono text-[10px] font-semibold">{days} DÍAS</span>
      <span className="font-display-x leading-[.95]" style={fitTitleStyle(plan.title, 18)}>
        {plan.title}
      </span>
    </Link>
  );
}

/** Screen 5b · Planes · biblioteca. */
export function PlanLibrary() {
  const { plans, counts } = usePlanLibrary();
  const mine = useMyPlans();
  const profile = useProfile();
  const { stage } = useCurrentStage();
  const [query, setQuery] = useState("");
  const hasChurchPlans = (plans.data ?? []).some((p) => p.source === "CHURCH");
  const [tab, setTab] = useState<LibraryTab>("for_you");

  const tabs: Array<{ id: LibraryTab; label: string }> = [
    { id: "for_you", label: "Para ti" },
    ...(hasChurchPlans ? [{ id: "church" as const, label: "Mi iglesia" }] : []),
    { id: "daily_life", label: CATEGORY_LABEL.daily_life },
    { id: "foundations", label: CATEGORY_LABEL.foundations },
    { id: "leadership", label: CATEGORY_LABEL.leadership },
  ];

  const visible = useMemo(() => {
    const all = plans.data ?? [];
    if (query.trim()) return all.filter((p) => matchesSearch(p, query));
    const filtered = filterPlans(all, tab, { stageId: stage?.id ?? null, interests: profile.data?.growth_areas ?? [] });
    return tab === "for_you" && filtered.length === 0 ? all : filtered;
  }, [plans.data, query, tab, stage?.id, profile.data?.growth_areas]);

  const active = (mine.data ?? []).filter((p) => p.status === "active");
  const finished = (mine.data ?? []).filter((p) => p.status === "completed");
  const heading = query.trim()
    ? "Resultados"
    : tab === "for_you"
      ? stage
        ? `Recomendados para ${stage.name.charAt(0)}${stage.name.slice(1).toLowerCase()}`
        : "Para ti"
      : tabs.find((t) => t.id === tab)?.label;

  return (
    <div className="flex flex-col pb-6">
      <div className="flex flex-col gap-3.5 px-6 pt-[18px] pb-3.5">
        <h1 className="m-0 font-display-x text-[44px] leading-[.85] tracking-[-.03em]">Planes</h1>
        <label className="flex h-12 items-center gap-2 rounded-full bg-white px-[18px]">
          <Search className="size-4 text-ink/45" aria-hidden />
          <span className="sr-only">Buscar planes</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar: ansiedad, identidad, noviazgo…"
            className="h-full flex-1 bg-transparent text-[15px] placeholder:text-ink/45 focus:outline-none"
          />
        </label>
      </div>

      <div
        className="flex gap-1.5 overflow-x-auto px-6 pb-3.5 [scrollbar-width:none]"
        role="tablist"
        aria-label="Categorías"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id && !query}
            onClick={() => {
              setTab(t.id);
              setQuery("");
            }}
            className={cn(
              "flex-none rounded-full px-3.5 py-[9px] text-[13px] font-semibold",
              tab === t.id && !query ? "bg-ink text-white" : "bg-white",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 px-3">
        {active.map((p) => {
          const next = nextPlanDay(p);
          const pct = Math.round((p.completedDays.length / Math.max(1, p.days.length)) * 100);
          return (
            <Link
              key={p.userPlanId}
              href={next ? `/devocional/?id=${next.devotional.id}&plan=${p.userPlanId}` : `/plan/?id=${p.planId}`}
              className="@container flex flex-col gap-3 rounded-[28px] bg-ink p-5 text-paper"
            >
              <span className="eyebrow text-lime">En curso</span>
              <span className="font-display-x leading-[.95]" style={fitTitleStyle(p.title, 24)}>
                {p.title}
              </span>
              <div className="flex items-center gap-2.5">
                <div
                  className="h-1.5 flex-1 rounded-[3px]"
                  style={{ background: `linear-gradient(90deg,#C6F432 ${pct}%,rgba(255,255,255,.15) ${pct}%)` }}
                />
                <span className="text-[13px] font-semibold">
                  Día {next?.dayNumber ?? p.days.length} / {p.days.length}
                </span>
              </div>
            </Link>
          );
        })}

        <h2 className="m-0 px-3 pt-3 text-[17px] font-bold">{heading}</h2>
        {plans.isPending || counts.isPending ? (
          <div className="grid grid-cols-2 gap-2.5" role="status" aria-label="Cargando planes">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[210px]" />
            ))}
          </div>
        ) : plans.isError || counts.isError ? (
          <StateView
            kind="error"
            action={
              <Button
                variant="ink"
                size="sm"
                onClick={() => {
                  void plans.refetch();
                  void counts.refetch();
                }}
              >
                Reintentar
              </Button>
            }
          />
        ) : visible.length === 0 ? (
          <StateView
            kind="empty"
            title={query ? "Nada con esa búsqueda" : "Pronto habrá planes aquí"}
            message={query ? "Prueba con otra palabra." : "Mientras tanto, explora otras categorías."}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
            {visible.map((p) => (
              <PlanCard key={p.id} plan={p} days={counts.data?.[p.id] ?? 0} />
            ))}
          </div>
        )}

        {finished.length ? (
          <section className="mt-3 flex flex-col gap-2" aria-labelledby="finished-plans">
            <h2 id="finished-plans" className="m-0 px-3 text-[17px] font-bold">
              Terminados
            </h2>
            {finished.map((p) => (
              <Link
                key={p.userPlanId}
                href={`/plan/?id=${p.planId}`}
                className="flex items-center justify-between rounded-[22px] bg-white px-[18px] py-4"
              >
                <span className="text-[15px] font-semibold">{p.title}</span>
                <span className="text-xs font-semibold text-ink/55">✓ {p.days.length} días</span>
              </Link>
            ))}
          </section>
        ) : null}
      </div>
    </div>
  );
}
