"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Small, joyful moment (devotional/plan completed, stage reached). Lime panel,
 * a gentle pop that is disabled under prefers-reduced-motion. Not a reward
 * mechanic: no points, no streaks.
 */
export function Celebration({
  eyebrow,
  title,
  message,
  actions,
}: {
  eyebrow: string;
  title: string;
  message: string;
  actions: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div
      className="animate-fade-in fixed inset-0 z-[70] flex items-end justify-center bg-ink/60 p-3 sm:items-center"
      role="presentation"
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
        className="celebration-pop pb-safe flex w-full max-w-[460px] flex-col gap-3 rounded-[30px] bg-lime p-6 text-ink outline-none"
      >
        <span className="eyebrow">{eyebrow}</span>
        <h2 id="celebration-title" className="m-0 font-display-x text-[40px] leading-[.88] tracking-[-.02em]">
          {title}
        </h2>
        <p className="m-0 text-[15px] leading-[1.45] font-medium">{message}</p>
        <span className="-rotate-3 font-hand text-[26px]" aria-hidden>
          paso a paso ✦
        </span>
        <div className="flex flex-col gap-2 pt-1">{actions}</div>
      </div>
    </div>
  );
}
