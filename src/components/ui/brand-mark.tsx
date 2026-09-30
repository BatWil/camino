import { cn } from "@/utils/cn";

/** Logo lockup from the design: lime dot + "CAMINO" in Archivo Expanded. */
export function BrandMark({ className, size = 15, badge }: { className?: string; size?: number; badge?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="rounded-full bg-lime" style={{ width: size + 7, height: size + 7 }} aria-hidden />
      <span className="font-display-x leading-none" style={{ fontSize: size }}>
        CAMINO
      </span>
      {badge ? (
        <span className="rounded bg-white/10 px-1.5 py-[3px] font-mono text-[9px] font-semibold">{badge}</span>
      ) : null}
    </div>
  );
}
