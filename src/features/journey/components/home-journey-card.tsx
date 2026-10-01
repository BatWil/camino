"use client";

import { fitTitleStyle } from "@/utils/fit-title";
import { ButtonLink } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { stageTheme } from "../domain/stages";
import { useJourney } from "../hooks/use-journey";

/** Home "MI CAMINO · ETAPA N" card (screen 2c): stage, ring and the six stage bars. */
export function HomeJourneyCard() {
  const journey = useJourney();

  if (journey.isPending) return <Skeleton className="h-[230px] rounded-[30px]" />;
  if (journey.isError || !journey.data) return null;

  const current = journey.data.find((s) => s.state === "current");
  if (!current) return null;
  const color = stageTheme(current.stage.key).color;

  return (
    <section className="flex flex-col gap-4 rounded-[30px] bg-ink p-[22px] text-paper" aria-labelledby="home-camino">
      <div className="flex items-center justify-between gap-3">
        <div className="@container flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="eyebrow tracking-[.12em] text-paper/55">Mi camino · Etapa {current.stage.position}</span>
          <h2
            id="home-camino"
            className="m-0 font-display-x text-[42px] leading-[.9]"
            style={{ color, ...fitTitleStyle(current.stage.name, 42) }}
          >
            {current.stage.name}
          </h2>
        </div>
        <ProgressRing
          value={current.percent}
          color={color}
          inner="#0D0A26"
          label={`${current.percent}% de ${current.stage.name}`}
        />
      </div>
      <div className="grid grid-cols-6 gap-1" aria-hidden>
        {journey.data.map((s) => {
          const c = stageTheme(s.stage.key).color;
          const background =
            s.state === "passed"
              ? c
              : s.state === "current"
                ? `linear-gradient(90deg, ${c} ${s.percent}%, rgba(255,255,255,.15) ${s.percent}%)`
                : "rgba(255,255,255,.15)";
          return <div key={s.stage.id} className="h-1.5 rounded-[3px]" style={{ background }} />;
        })}
      </div>
      <ButtonLink href="/camino" variant="lime" size="md" block>
        Continuar mi camino
      </ButtonLink>
    </section>
  );
}
