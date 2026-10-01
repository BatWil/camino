"use client";

import { tap } from "@/lib/native/haptics";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { SplashState } from "@/components/layout/splash-state";
import { StateView } from "@/components/feedback/state-view";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { cn } from "@/utils/cn";
import { badgeLabel, conferenceDays, SESSION_STYLE, sessionTime } from "../domain/conference";
import { useAgenda, useConference } from "../hooks/use-conferences";

/** Screen 8c · Conferencia · mi agenda (toca un día). */
export function ConferenceAgenda() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const { conference, registration } = useConference(id);
  const { sessions, mine, toggle } = useAgenda(id);
  const profile = useProfile();
  const days = conference.data ? conferenceDays(conference.data.starts_on, conference.data.ends_on) : [];
  const [picked, setPicked] = useState<string | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);
  const [badge, setBadge] = useState(false);

  if (conference.isPending || sessions.isPending) return <SplashState />;
  if (!conference.data) {
    return (
      <main className="pt-safe flex min-h-dvh items-center bg-paper px-5">
        <StateView kind="empty" title="Agenda no disponible" />
      </main>
    );
  }
  const day = picked ?? days.find((d) => sessions.data?.some((s) => s.day === d.iso))?.iso ?? days[0]?.iso;
  const saved = new Set(mine.data ?? []);
  const slots = (sessions.data ?? []).filter((s) => s.day === day && (!onlyMine || saved.has(s.id)));

  return (
    <main className="pt-safe pb-safe min-h-dvh bg-paper">
      <div className="mx-auto flex max-w-[600px] flex-col">
        <div className="flex items-center justify-between px-5 py-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="flex size-10 items-center justify-center rounded-full bg-white"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          {registration.data ? (
            <button
              type="button"
              onClick={() => setBadge(true)}
              className="rounded-full bg-ink px-3 py-2 font-mono text-[11px] font-semibold text-lime"
            >
              MI GAFETE
            </button>
          ) : null}
        </div>
        <div className="flex items-end justify-between px-6 py-3.5">
          <h1 className="m-0 font-display-x text-[40px] leading-[.85] tracking-[-.03em]">Mi agenda</h1>
          <button
            type="button"
            aria-pressed={onlyMine}
            onClick={() => setOnlyMine((v) => !v)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              onlyMine ? "bg-ink text-white" : "bg-white",
            )}
          >
            Solo lo mío
          </button>
        </div>
        <div
          className="grid gap-1.5 px-3 pb-3.5"
          style={{ gridTemplateColumns: `repeat(${Math.min(days.length, 5)},1fr)` }}
          role="tablist"
        >
          {days.map((d) => {
            const on = d.iso === day;
            return (
              <button
                key={d.iso}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setPicked(d.iso)}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-0.5 rounded-[18px] transition-all duration-200",
                  on ? "bg-ink text-lime" : "bg-white text-ink",
                )}
              >
                <span className="font-mono text-[10px] font-semibold">{d.dow}</span>
                <span className="font-display text-xl font-black">{d.n}</span>
              </button>
            );
          })}
        </div>
        <ul className="m-0 flex list-none flex-col gap-2 px-3 pb-8" role="tabpanel">
          {slots.map((s) => {
            const style = SESSION_STYLE[s.kind];
            const on = saved.has(s.id);
            return (
              <li key={s.id} className="flex items-stretch gap-3">
                <span className="w-[52px] flex-none pt-4 font-mono text-xs font-semibold text-ink/55">
                  {sessionTime(s.starts_at)}
                </span>
                <div
                  className="flex flex-1 items-start justify-between gap-2 rounded-[20px] px-4 py-3.5"
                  style={{ background: style.bg, color: style.color }}
                >
                  <span className="flex flex-col gap-[3px]">
                    <span className="eyebrow">{style.tag}</span>
                    <span className="text-[15px] leading-[1.25] font-bold">{s.title}</span>
                    {s.place ? <span className="text-xs opacity-75">{s.place}</span> : null}
                  </span>
                  <button
                    type="button"
                    aria-pressed={on}
                    aria-label={on ? `Quitar ${s.title} de mi agenda` : `Agregar ${s.title} a mi agenda`}
                    onClick={() => {
                      tap();
                      toggle.mutate({ sessionId: s.id, on: !on });
                    }}
                    className={cn("-m-1 p-1", on && "animate-pop")}
                  >
                    <Star className="size-5" fill={on ? "currentColor" : "none"} aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
          {!slots.length ? (
            <li className="rounded-[20px] bg-white px-4 py-4 text-sm text-ink/60">
              {onlyMine ? "No guardaste actividades este día. Toca ☆ para agregarlas." : "Sin actividades este día."}
            </li>
          ) : null}
        </ul>
      </div>
      <Sheet open={badge} onClose={() => setBadge(false)} title="Mi gafete">
        {registration.data ? (
          <div className="flex flex-col items-center gap-3 rounded-[26px] bg-ink p-6 text-center text-paper">
            <span className="eyebrow text-lime">{conference.data.title}</span>
            <span className="font-display-x text-[26px] leading-none">{profile.data?.display_name ?? ""}</span>
            <span className="rounded-2xl bg-lime px-5 py-3 font-mono text-2xl font-bold tracking-[.12em] text-ink">
              {badgeLabel(registration.data.badge_code)}
            </span>
            <span className="text-xs text-paper/60">Muestra este código en el registro de la conferencia.</span>
          </div>
        ) : null}
      </Sheet>
    </main>
  );
}
