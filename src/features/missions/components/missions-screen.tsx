"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/feedback/state-view";
import { useCurrentChurch } from "@/features/churches/hooks/use-access";
import type { MissionProgram } from "@/lib/supabase/database.types";
import { cn } from "@/utils/cn";
import { money, parseAmount, PRESET_AMOUNTS, progressPercent } from "../domain/missions";
import { useCampaign } from "../hooks/use-missions";

const COPY: Record<
  MissionProgram,
  { eyebrow: string; title: string; lead: string; bg: string; fg: string; accent: string }
> = {
  speed_the_light: {
    eyebrow: "ENVIAR · SPEED THE LIGHT",
    title: "Equipa a un misionero",
    lead: "Tu grupo junta ofrendas para vehículos y equipo que llevan el evangelio.",
    bg: "#FF8A3D",
    fg: "#0D0A26",
    accent: "#FF8A3D",
  },
  ambassadors: {
    eyebrow: "ENVIAR · EMBAJADORES EN MISIÓN",
    title: "Ve a las naciones",
    lead: "Tu grupo apoya viajes misioneros de corto plazo para servir y compartir a Jesús.",
    bg: "#FF4D5E",
    fg: "#FFFFFF",
    accent: "#FF4D5E",
  },
};

/** Screen 8f · Speed the Light · meta misionera del grupo. */
export function MissionsScreen() {
  const router = useRouter();
  const raw = useSearchParams().get("programa");
  const program: MissionProgram = raw === "ambassadors" ? "ambassadors" : "speed_the_light";
  const copy = COPY[program];
  const { church, isPending: churchPending } = useCurrentChurch();
  const { campaign, totals, mine, record } = useCampaign(program);
  const [choice, setChoice] = useState<number | "other" | null>(100);
  const [other, setOther] = useState("");
  const c = campaign.data;
  const amount = choice === "other" ? parseAmount(other) : choice;
  const raised = totals.data?.confirmed ?? 0;
  const pending = totals.data?.recorded ?? 0;
  const pct = c ? progressPercent(raised, c.goal_amount) : 0;

  return (
    <main className="min-h-dvh" style={{ background: copy.bg, color: copy.fg }}>
      <div className="mx-auto flex min-h-dvh max-w-[600px] flex-col">
        <div className="px-5 pb-2" style={{ paddingTop: "calc(var(--safe-top) + 8px)" }}>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="flex size-10 items-center justify-center rounded-full bg-white/35"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
        </div>
        <div className="flex flex-col gap-3 px-6 pt-5 pb-6">
          <span className="font-mono text-[11px] font-semibold tracking-[.1em]">{copy.eyebrow}</span>
          <h1 className="m-0 font-display-x text-[38px] leading-[.86] tracking-[-.03em]">{copy.title}</h1>
          <p className="m-0 text-[15px] leading-[1.45] font-medium">{copy.lead}</p>
        </div>

        <div
          className="flex flex-1 flex-col gap-2.5 rounded-t-[32px] bg-paper px-3 pt-[22px] text-ink"
          style={{ paddingBottom: "calc(var(--safe-bottom) + 30px)" }}
        >
          {churchPending || campaign.isPending ? (
            <Skeleton className="h-40 rounded-[26px]" />
          ) : !church ? (
            <StateView
              kind="empty"
              title="Da con tu iglesia"
              message="Las metas misioneras son de tu iglesia. Únete para participar."
              action={
                <ButtonLink href="/unirse" variant="ink" size="sm">
                  Unirme a mi iglesia
                </ButtonLink>
              }
            />
          ) : !c ? (
            <StateView
              kind="empty"
              title="Tu iglesia aún no tiene una meta"
              message="Cuando tus líderes abran una campaña misionera, la verás aquí."
            />
          ) : (
            <>
              <section
                className="flex flex-col gap-3.5 rounded-[26px] bg-ink p-[22px] text-paper"
                aria-label="Meta del grupo"
              >
                <div className="flex items-end justify-between">
                  <span className="flex flex-col gap-1">
                    <span className="eyebrow text-paper/55">
                      Meta {c.year} · {church.churchName}
                    </span>
                    <span className="font-display-x text-4xl leading-[.9]" style={{ color: copy.accent }}>
                      {money(raised, c.currency)}
                    </span>
                  </span>
                  <span className="text-[13px] text-paper/60">de {money(c.goal_amount, c.currency)}</span>
                </div>
                <div
                  className="animate-fill h-3 rounded-md"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  style={
                    {
                      "--fill": `${pct}%`,
                      background: `linear-gradient(90deg,${copy.accent} var(--fill),rgba(255,255,255,.12) var(--fill))`,
                    } as React.CSSProperties
                  }
                />
                <span className="text-[13px] text-paper/75">
                  {pct}% · {c.title}
                  {pending > 0 ? ` · ${money(pending, c.currency)} por confirmar` : ""}
                </span>
              </section>

              {c.story_title ? (
                <div className="flex items-center gap-3.5 rounded-[22px] bg-white p-4">
                  <span
                    className="size-16 flex-none rounded-2xl"
                    style={{ background: "repeating-linear-gradient(135deg,#FFE0C9 0 6px,#FFD3B3 6px 12px)" }}
                    aria-hidden
                  />
                  <span className="flex flex-col gap-[3px]">
                    <span className="text-[15px] font-bold">{c.story_title}</span>
                    {c.story_quote ? (
                      <span className="text-xs leading-[1.35] text-ink/60">“{c.story_quote}”</span>
                    ) : null}
                  </span>
                </div>
              ) : null}

              {record.isSuccess ? (
                <div className="celebration-pop flex flex-col gap-1 rounded-[22px] bg-stage-crece p-[18px]">
                  <span className="text-[15px] font-bold">¡Gracias por dar! ✦</span>
                  <span className="text-sm">
                    Entrega tu ofrenda en tu iglesia. Cuando el pastor la reciba, sumará a la meta.
                  </span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Monto">
                    {[...PRESET_AMOUNTS, "other" as const].map((v) => {
                      const on = choice === v;
                      return (
                        <button
                          key={String(v)}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setChoice(v)}
                          className={cn("h-[52px] rounded-2xl font-bold", on ? "bg-ink" : "bg-white")}
                          style={on ? { color: copy.accent } : undefined}
                        >
                          {v === "other" ? "Otro" : `$${v}`}
                        </button>
                      );
                    })}
                  </div>
                  {choice === "other" ? (
                    <input
                      inputMode="decimal"
                      aria-label="Otro monto"
                      placeholder="Monto"
                      value={other}
                      onChange={(e) => setOther(e.target.value)}
                      className="h-[52px] rounded-2xl bg-white px-4 text-base font-semibold focus:outline-2 focus:outline-ink"
                    />
                  ) : null}
                  {record.isError ? (
                    <p role="alert" className="m-0 text-sm font-semibold text-coral">
                      {record.error.message}
                    </p>
                  ) : null}
                  <Button
                    variant="ink"
                    size="lg"
                    block
                    className="h-[58px]"
                    disabled={!amount}
                    loading={record.isPending}
                    onClick={() => amount && record.mutate(amount)}
                  >
                    Dar mi ofrenda
                  </Button>
                </>
              )}
              <span className="text-center text-xs text-ink/55">
                Tu monto es privado. El grupo solo ve el total. No se cobra nada en la app.
              </span>

              {mine.data?.length ? (
                <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0" aria-label="Mis ofrendas">
                  {mine.data.map((o) => (
                    <li key={o.id} className="flex justify-between rounded-2xl bg-white px-4 py-3 text-sm">
                      <span className="font-semibold">{money(o.amount, c.currency)}</span>
                      <span className="text-ink/60">
                        {o.status === "confirmed"
                          ? "Recibida ✓"
                          : o.status === "rejected"
                            ? "No recibida"
                            : "Por confirmar"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
