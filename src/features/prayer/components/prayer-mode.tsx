"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Maximize2, Pause, Play, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { isNative } from "@/lib/platform";
import { cn } from "@/utils/cn";
import { GUIDE, formatClock, stepForElapsed } from "../domain/prayer";
import { usePrayer, usePrayerMutations } from "../hooks/use-prayers";

type WakeLockSentinelLike = { release(): Promise<void> };

/** Keeps the screen on while praying (where supported); degrades silently. */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const nav = navigator as Navigator & { wakeLock?: { request(type: "screen"): Promise<WakeLockSentinelLike> } };
    if (!nav.wakeLock) return;
    let sentinel: WakeLockSentinelLike | null = null;
    const acquire = () =>
      nav
        .wakeLock!.request("screen")
        .then((s) => (sentinel = s))
        .catch(() => {});
    void acquire();
    const onVisible = () => document.visibilityState === "visible" && void acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release().catch(() => {});
    };
  }, [active]);
}

function softVibrate() {
  try {
    navigator.vibrate?.(25);
  } catch {
    /* unsupported */
  }
}

/** Screen 2g · Modo oración (fullscreen, minimal). */
export function PrayerMode({ minutes, prayerId }: { minutes: number | null; prayerId: string | null }) {
  const router = useRouter();
  const total = minutes ? minutes * 60 : null;
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [manualStep, setManualStep] = useState(0);
  const [done, setDone] = useState(false);
  const last = useRef<number | null>(null);
  const { logSession } = usePrayerMutations();
  const prayer = usePrayer(prayerId);

  const step = stepForElapsed(elapsed, total, manualStep);
  const remaining = total === null ? elapsed : total - elapsed;
  const finished = done || (total !== null && elapsed >= total);
  useWakeLock(running && !finished);

  // When the session ends (timer or by hand): save only its duration, once.
  const logged = useRef(false);
  useEffect(() => {
    if (!finished || logged.current) return;
    logged.current = true;
    if (elapsed >= 30) logSession.mutate(elapsed);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  }, [finished, elapsed, logSession]);

  useEffect(() => {
    if (!running || finished) {
      last.current = null;
      return;
    }
    const id = setInterval(() => {
      const now = Date.now();
      const delta = last.current ? (now - last.current) / 1000 : 0;
      last.current = now;
      setElapsed((e) => (total === null ? e + delta : Math.min(total, e + delta)));
    }, 250);
    return () => clearInterval(id);
  }, [running, finished, total]);

  const prevStep = useRef(step);
  useEffect(() => {
    if (prevStep.current !== step) softVibrate();
    prevStep.current = step;
  }, [step]);

  const finish = () => {
    setRunning(false);
    setDone(true);
  };

  const canFullscreen =
    typeof document !== "undefined" && !isNative() && Boolean(document.documentElement.requestFullscreen);

  if (finished) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#15103A] px-7 text-center text-paper">
        <span className="font-display-x text-[56px] leading-[.9]">Amén</span>
        <p className="m-0 max-w-[300px] text-[17px] leading-normal text-paper/80">
          {elapsed >= 60
            ? `Apartaste ${Math.round(elapsed / 60)} min para hablar con Dios.`
            : "Gracias por este momento con Dios."}
        </p>
        <span className="-rotate-3 font-hand text-[28px] text-stage-comparte">siempre puedes volver ✦</span>
        <ButtonLink href="/oracion" variant="lime" size="lg" replace>
          Volver a mi lugar de oración
        </ButtonLink>
      </main>
    );
  }

  const g = GUIDE[step];
  return (
    <main
      className="relative flex min-h-dvh flex-col items-center justify-between overflow-hidden bg-[#15103A] px-7 text-paper"
      style={{ paddingTop: "calc(var(--safe-top) + 80px)", paddingBottom: "calc(var(--safe-bottom) + 60px)" }}
    >
      <div
        className="pointer-events-none absolute top-[44%] left-1/2 -mt-[210px] -ml-[210px] size-[420px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(155,107,255,.35), rgba(155,107,255,0) 65%)" }}
        aria-hidden
      />
      {canFullscreen ? (
        <button
          type="button"
          onClick={() => void document.documentElement.requestFullscreen().catch(() => {})}
          aria-label="Pantalla completa"
          className="absolute top-[calc(var(--safe-top)+16px)] right-5 flex size-10 items-center justify-center rounded-full text-paper/60"
        >
          <Maximize2 className="size-4" aria-hidden />
        </button>
      ) : null}
      <span className="relative font-mono text-[11px] font-semibold tracking-[.16em] text-paper/50 uppercase">
        {step + 1} / {GUIDE.length} · {g.title}
      </span>
      <div className="relative flex flex-col items-center gap-5">
        <span
          className="font-display text-[92px] font-medium tracking-[-.03em] tabular-nums"
          style={{ fontStretch: "110%" }}
          role="timer"
          aria-label={total === null ? "Tiempo transcurrido" : "Tiempo restante"}
        >
          {formatClock(remaining)}
        </span>
        <p
          key={step}
          className="animate-fade-in m-0 max-w-[280px] text-center text-[19px] leading-normal text-paper/80"
          aria-live="polite"
        >
          {g.prompt}
        </p>
        {step === 3 && prayer.data ? (
          <p className="m-0 max-w-[280px] text-center text-[15px] font-semibold text-stage-comparte">
            “{prayer.data.title}”
          </p>
        ) : null}
      </div>
      <div className="relative flex flex-col items-center gap-[22px]">
        <div className="flex gap-2" aria-hidden>
          {GUIDE.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-2 rounded-full transition-all",
                i === step ? "w-6 bg-paper" : i < step ? "w-2 bg-stage-comparte" : "w-2 bg-paper/25",
              )}
            />
          ))}
        </div>
        <div className="flex gap-3.5">
          <button
            type="button"
            onClick={finish}
            aria-label="Terminar"
            className="flex size-14 items-center justify-center rounded-full border-[1.5px] border-paper/25"
          >
            <X className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            aria-label={running ? "Pausar" : "Continuar"}
            className="flex size-14 items-center justify-center rounded-full bg-paper text-[#15103A]"
          >
            {running ? (
              <Pause className="size-5" fill="currentColor" aria-hidden />
            ) : (
              <Play className="size-5" fill="currentColor" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => (step === GUIDE.length - 1 ? finish() : setManualStep(step + 1))}
            aria-label={step === GUIDE.length - 1 ? "Terminar" : "Siguiente momento"}
            className="flex size-14 items-center justify-center rounded-full border-[1.5px] border-paper/25"
          >
            <ArrowRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>
      <span className="sr-only">
        <button type="button" onClick={() => router.back()}>
          Salir
        </button>
      </span>
    </main>
  );
}
