import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/utils/cn";
import { TOTAL_STEPS } from "../domain/flow";

export type StepTone = "ink" | "yellow" | "paper" | "violet" | "lime" | "coral";

/** Background per step. Steps 2 (yellow, 4b) and 4 (violet, 2a) come from the design. */
export const TONES: Record<StepTone, { bg: string; dark: boolean; fill: string; rest: string }> = {
  ink: { bg: "bg-ink text-paper", dark: true, fill: "bg-lime", rest: "bg-white/30" },
  yellow: { bg: "bg-stage-encuentra text-ink", dark: false, fill: "bg-ink", rest: "bg-ink/20" },
  paper: { bg: "bg-paper text-ink", dark: false, fill: "bg-ink", rest: "bg-ink/20" },
  violet: { bg: "bg-violet text-white", dark: true, fill: "bg-lime", rest: "bg-white/30" },
  lime: { bg: "bg-lime text-ink", dark: false, fill: "bg-ink", rest: "bg-ink/20" },
  coral: { bg: "bg-coral text-ink", dark: false, fill: "bg-ink", rest: "bg-ink/20" },
};

export function StepFrame({
  tone,
  step,
  onBack,
  caveat,
  title,
  description,
  children,
}: {
  tone: StepTone;
  step: number;
  onBack?: () => void;
  caveat?: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  const t = TONES[tone];
  return (
    <main className={cn("pt-safe pb-safe flex min-h-dvh flex-col transition-colors duration-300", t.bg)}>
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">
        <div className="flex items-center gap-3.5 px-6 pt-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Paso anterior"
              className="-ml-2 flex size-10 items-center justify-center rounded-full"
            >
              <ArrowLeft className="size-[22px]" aria-hidden />
            </button>
          ) : (
            <span className="size-10" aria-hidden />
          )}
          <div
            className="grid flex-1 grid-cols-6 gap-1"
            role="progressbar"
            aria-label="Progreso"
            aria-valuemin={1}
            aria-valuemax={TOTAL_STEPS}
            aria-valuenow={step}
            aria-valuetext={`Paso ${step} de ${TOTAL_STEPS}`}
          >
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div key={i} className={cn("h-[5px] rounded-[3px] transition-colors", i < step ? t.fill : t.rest)} />
            ))}
          </div>
        </div>
        <div key={step} className="animate-fade-in flex flex-1 flex-col gap-3 px-6 pt-[34px] pb-6">
          {caveat ? (
            <span className={cn("font-hand text-[26px] leading-none", t.dark ? "text-lime" : "")}>{caveat}</span>
          ) : null}
          <h1 className="m-0 font-display-x text-[34px] leading-[.95] tracking-[-.02em]">{title}</h1>
          {description ? <p className="m-0 mb-2 text-[15px] leading-[1.45] font-medium">{description}</p> : null}
          {children}
        </div>
      </div>
    </main>
  );
}

/** Primary action at the bottom of a step + reassurance line, as in 2a. */
export function StepFooter({
  tone,
  label = "Continuar",
  disabled,
  loading,
  onClick,
  note,
  secondary,
}: {
  tone: StepTone;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
  note?: string;
  secondary?: ReactNode;
}) {
  const onInk = tone === "ink";
  return (
    <>
      <div className="flex-1" />
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "mt-5 flex h-[58px] items-center justify-center gap-2 rounded-full text-base font-bold transition-transform active:scale-[0.98] disabled:opacity-40",
          onInk ? "bg-lime text-ink" : "bg-ink text-white",
        )}
      >
        {loading ? (
          <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />
        ) : null}
        {label}
      </button>
      {secondary}
      {note ? <span className="text-center text-xs opacity-75">{note}</span> : null}
    </>
  );
}
