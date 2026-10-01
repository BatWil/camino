"use client";

import { Button } from "@/components/ui/button";
import { stageTheme } from "@/features/journey/domain/stages";
import type { OnboardingState } from "../domain/flow";
import { GROWTH_OPTIONS, labelFor } from "../domain/options";

/** Screen 2b · "TU CAMINO ESTÁ LISTO." */
export function OnboardingFinal({ state, onStart }: { state: OnboardingState; onStart: () => void }) {
  const result = state.result!;
  const theme = stageTheme(result.stageKey);
  const chips = state.growthAreas.slice(0, 3).map((g) => labelFor(GROWTH_OPTIONS, g));
  const steps = [
    "Un devocional corto cada mañana",
    "Un reto pequeño cada semana",
    state.churchName ? `Conectado a ${state.churchName}` : "Cuando quieras, conéctate con tu iglesia",
  ];

  return (
    <main className="pt-safe pb-safe flex min-h-dvh flex-col bg-ink text-paper">
      <div className="animate-fade-in mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-5 px-6 pt-10 pb-[30px]">
        <h1 className="m-0 font-display-x text-[50px] leading-[.86] tracking-[-.03em]">
          Tu camino
          <br />
          está <span className="text-lime">listo.</span>
        </h1>
        <div className="relative my-1.5 h-[250px]">
          <div
            className="absolute top-[30px] left-0 h-[170px] w-[220px] -rotate-6 rounded-[26px]"
            style={{ background: result.stageKey === "encuentra" ? "#C6F432" : "#FFC83D" }}
            aria-hidden
          />
          <div
            className="absolute top-0 right-0 flex w-[250px] rotate-3 flex-col gap-2.5 rounded-[26px] p-[22px] shadow-[0_20px_40px_-16px_rgba(0,0,0,.6)]"
            style={{ background: theme.color, color: theme.onColor }}
          >
            <span className="eyebrow">Empiezas en</span>
            <span className="font-display-x text-[40px] leading-[.9]">{result.stageName}</span>
            {result.stageDescription ? (
              <span className="text-sm leading-[1.4] font-medium">{result.stageDescription}</span>
            ) : null}
            {chips.length ? (
              <div className="flex flex-wrap gap-1.5">
                {chips.map((c) => (
                  <span key={c} className="rounded-full bg-ink px-2.5 py-[5px] text-xs font-semibold text-white">
                    {c}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <span className="absolute bottom-1 left-3.5 -rotate-[4deg] font-hand text-[26px] text-lime">
            paso a paso ✦
          </span>
        </div>
        <ol className="m-0 flex list-none flex-col gap-2.5 p-0 text-[15px] leading-[1.4] text-paper/80">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-3">
              <span className="flex size-7 flex-none items-center justify-center rounded-full bg-lime text-[13px] font-bold text-ink">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
        <div className="flex-1" />
        <Button variant="lime" size="lg" block className="h-[58px]" onClick={onStart}>
          Comenzar
        </Button>
      </div>
    </main>
  );
}
