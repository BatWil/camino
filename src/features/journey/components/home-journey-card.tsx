"use client";

import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { stageTheme } from "../domain/stages";
import { useCurrentStage } from "../hooks/use-current-stage";

/**
 * Home "MI CAMINO" card (screen 2c). Shows the real current stage; the progress
 * ring and partial bar of the design arrive with module progress in M2.
 */
export function HomeJourneyCard() {
  const { stage, stages, isPending } = useCurrentStage();

  if (isPending) return <Skeleton className="h-[230px] rounded-[30px]" />;

  const current = stage?.position ?? 0;
  return (
    <section className="flex flex-col gap-4 rounded-[30px] bg-ink p-[22px] text-paper" aria-labelledby="home-camino">
      <div className="flex flex-col gap-1.5">
        <span className="eyebrow tracking-[.12em] text-paper/55">
          {stage ? `Mi camino · Etapa ${stage.position}` : "Mi camino · 6 etapas"}
        </span>
        <h2
          id="home-camino"
          className="m-0 font-display-x text-[42px] leading-[.9]"
          style={{ color: stage ? stageTheme(stage.key).color : "#C6F432" }}
        >
          {stage ? stage.name : "Paso a paso"}
        </h2>
      </div>
      <div className="grid grid-cols-6 gap-1" aria-hidden>
        {stages.map((s) => (
          <div
            key={s.id}
            className="h-1.5 rounded-[3px]"
            style={{ background: s.position <= current ? stageTheme(s.key).color : "rgba(255,255,255,.15)" }}
          />
        ))}
      </div>
      <ButtonLink href="/camino" variant="lime" size="md" block>
        Continuar mi camino
      </ButtonLink>
    </section>
  );
}
