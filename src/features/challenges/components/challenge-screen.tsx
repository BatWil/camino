"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/feedback/state-view";
import { useJourneyStages } from "@/features/journey/hooks/use-journey-stages";
import { localIsoDate } from "@/features/rhythm/domain/rhythm";
import { cn } from "@/utils/cn";
import { fitTitleStyle } from "@/utils/fit-title";
import { challengeSlots, challengeMessage } from "../domain/slots";
import { useChallenge, useChallengeCheckin } from "../hooks/use-challenge";

/** Screen 6a · Reto · "toca hoy para completarlo". */
export function ChallengeScreen({ id }: { id: string | null }) {
  const { list, challenge, checkins } = useChallenge(id);
  const stages = useJourneyStages();
  const checkin = useChallengeCheckin(challenge?.id);

  if (list.isPending || (challenge && checkins.isPending)) {
    return (
      <main className="min-h-dvh bg-coral px-6 pt-20" role="status" aria-label="Cargando reto">
        <Skeleton className="h-60" />
      </main>
    );
  }
  if (list.isError || checkins.isError) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] items-center px-3">
        <StateView
          kind="error"
          action={
            <Button
              variant="ink"
              size="sm"
              onClick={() => {
                void list.refetch();
                void checkins.refetch();
              }}
            >
              Reintentar
            </Button>
          }
        />
      </main>
    );
  }
  if (!challenge) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] items-center px-3">
        <StateView
          kind="empty"
          title="No hay un reto activo"
          message="Pronto habrá un reto nuevo para esta semana."
          action={
            <Link href="/inicio" className="font-semibold text-violet">
              Volver al inicio
            </Link>
          }
        />
      </main>
    );
  }

  const today = localIsoDate(new Date());
  const slots = challengeSlots(checkins.data ?? [], challenge.days_target, today);
  const done = (checkins.data ?? []).length;
  const stage = stages.data?.find((s) => s.id === challenge.stage_id);

  return (
    <main className="pt-safe pb-safe flex min-h-dvh flex-col bg-coral text-ink">
      <div className="mx-auto flex w-full max-w-[600px] flex-1 flex-col">
        <div className="px-5 py-2">
          <Link
            href="/inicio"
            aria-label="Volver"
            className="flex size-10 items-center justify-center rounded-full bg-white/35"
          >
            <ArrowLeft className="size-[18px]" aria-hidden />
          </Link>
        </div>
        <div className="@container flex flex-1 flex-col gap-3.5 px-6 pt-6 pb-6">
          <span className="font-mono text-[11px] font-semibold tracking-[.1em] uppercase">
            Reto de la semana{stage ? ` · ${stage.name}` : ""}
          </span>
          <h1 className="m-0 font-display-x leading-[.86] tracking-[-.03em]" style={fitTitleStyle(challenge.title, 46)}>
            {challenge.title}
          </h1>
          <p className="m-0 text-base leading-normal font-medium">{challenge.description}</p>
          <ol
            className="m-0 mt-2.5 grid list-none gap-1.5 p-0"
            style={{ gridTemplateColumns: `repeat(${challenge.days_target}, minmax(0, 1fr))` }}
            aria-label={`${done} de ${challenge.days_target} días`}
          >
            {slots.map((slot, i) => {
              const actionable = slot.kind === "today" || slot.undoable;
              const body = (
                <>
                  <span className="font-mono text-[10px] font-semibold">{slot.label}</span>
                  <span className="font-display text-xl font-black">
                    {slot.kind === "done" ? "✓" : slot.kind === "today" ? "+" : ""}
                  </span>
                </>
              );
              const className = cn(
                "flex h-[86px] w-full flex-col items-center justify-center gap-1 rounded-[18px] border-2 border-dashed transition-all",
                slot.kind === "done"
                  ? "border-transparent bg-ink text-lime"
                  : slot.kind === "today"
                    ? "border-ink bg-white"
                    : "border-transparent bg-white/30",
              );
              return (
                <li key={i}>
                  {actionable ? (
                    <button
                      type="button"
                      className={className}
                      disabled={checkin.isPending}
                      onClick={() => checkin.mutate(slot.kind === "today")}
                      aria-label={slot.kind === "today" ? "Marcar hoy como hecho" : "Deshacer hoy"}
                    >
                      {body}
                    </button>
                  ) : (
                    <div className={className}>{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
          <span className="-rotate-2 origin-left font-hand text-[28px]" aria-live="polite">
            {challengeMessage(done, challenge.days_target)}
          </span>
          {checkin.isError ? (
            <p role="alert" className="m-0 text-sm font-semibold">
              No pudimos guardar. Inténtalo de nuevo.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
