/** Conic progress ring used on the Home "MI CAMINO" card and the stage card. */
export function ProgressRing({
  value,
  color,
  track = "rgba(255,255,255,.1)",
  inner,
  size = 84,
  thickness = 9,
  label,
}: {
  value: number;
  color: string;
  track?: string;
  inner: string;
  size?: number;
  thickness?: number;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="img"
      aria-label={label ?? `${pct}%`}
      className="animate-fill flex shrink-0 items-center justify-center rounded-full"
      style={
        {
          width: size,
          height: size,
          "--fill": `${pct}%`,
          background: `conic-gradient(${color} 0 var(--fill), ${track} var(--fill) 100%)`,
        } as React.CSSProperties
      }
    >
      <div
        className="flex items-center justify-center rounded-full font-display-x text-lg normal-case"
        style={{ width: size - thickness * 2, height: size - thickness * 2, background: inner }}
      >
        {pct}%
      </div>
    </div>
  );
}
