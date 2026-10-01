"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import { useRhythm } from "../hooks/use-rhythm";

/**
 * "Tu ritmo" (coral card of screen 2c). The design's "RACHA" card keeps its shape
 * and colour but speaks of consistency, not of a streak to lose.
 */
export function RhythmCard({ className }: { className?: string }) {
  const rhythm = useRhythm();
  if (rhythm.isPending) return <Skeleton className={cn("h-[170px]", className)} />;
  if (rhythm.isError || !rhythm.data) return null;
  const r = rhythm.data;

  return (
    <section
      className={cn("flex flex-col gap-2 rounded-[26px] bg-coral p-[18px] text-ink", className)}
      aria-labelledby="rhythm-title"
    >
      <span id="rhythm-title" className="eyebrow">
        Tu ritmo
      </span>
      <span className="font-display-x text-[34px] leading-[.9]">{r.activeCount} de 7</span>
      <span className="text-[12.5px] leading-[1.35] font-medium">{r.message}</span>
      <div className="flex gap-1" role="img" aria-label={`${r.activeCount} de los últimos 7 días con tiempo para Dios`}>
        {r.days.map((d) => (
          <span
            key={d.date}
            className={cn(
              "size-3 rounded-full",
              d.active ? "bg-ink" : "border-2 border-ink",
              d.isToday && !d.active && "border-dashed",
            )}
          />
        ))}
      </div>
    </section>
  );
}
