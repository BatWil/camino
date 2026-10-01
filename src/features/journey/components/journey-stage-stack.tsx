"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/feedback/state-view";
import { stageNumber, stageTheme } from "../domain/stages";
import { useCurrentStage } from "../hooks/use-current-stage";
import { useJourneyStages } from "../hooks/use-journey-stages";

/**
 * "Mi Camino · estaciones apiladas" (screen 2d): stages as stacked tickets in
 * their colours. Per-user progress, modules and the "estás aquí" state arrive in M2.
 */
export function JourneyStageStack() {
  const stages = useJourneyStages();
  const { stage: current } = useCurrentStage();

  if (stages.isPending) {
    return (
      <div className="flex flex-col gap-2 px-3" role="status" aria-label="Cargando etapas">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-[74px]" />
        ))}
      </div>
    );
  }

  if (stages.isError) {
    return (
      <div className="px-3">
        <StateView
          kind="error"
          message="No pudimos cargar tu camino."
          action={
            <Button variant="ink" size="sm" onClick={() => stages.refetch()}>
              Reintentar
            </Button>
          }
        />
      </div>
    );
  }

  if (stages.data.length === 0) {
    return (
      <div className="px-3">
        <StateView kind="empty" />
      </div>
    );
  }

  return (
    <ol className="m-0 flex list-none flex-col p-0 px-3" aria-label="Etapas del camino">
      {stages.data.map((stage, i) => {
        const theme = stageTheme(stage.key);
        const last = i === stages.data.length - 1;
        const here = current?.id === stage.id;
        return (
          <li
            key={stage.id}
            aria-current={here ? "step" : undefined}
            className="relative flex items-center justify-between px-5 pt-[18px]"
            style={{
              background: theme.color,
              color: theme.onColor,
              marginTop: i === 0 ? 0 : -18,
              paddingBottom: last ? 22 : 34,
              borderRadius: last ? 26 : "26px 26px 0 0",
              boxShadow: i === 0 ? undefined : "0 -10px 24px -12px rgba(13,10,38,.3)",
            }}
          >
            {here ? (
              <span className="absolute -top-[30px] right-[18px] -rotate-6 font-hand text-[26px] text-ink">
                estás aquí ↓
              </span>
            ) : null}
            <span className="font-display-x text-[22px]">{stage.name}</span>
            <span className="font-mono text-[11px] font-semibold">{stageNumber(stage.position)}</span>
          </li>
        );
      })}
    </ol>
  );
}
