import type { ReactNode } from "react";

/** Large poster heading ("TU CAMINO", "MINISTERIOS") with its muted subtitle. */
export function ScreenHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4 px-6 pt-[18px] pb-[18px]">
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 font-display-x text-[52px] leading-[.85] tracking-[-.03em]">{title}</h1>
        {subtitle ? <p className="m-0 text-[15px] text-ink/60">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}
