"use client";

import Link from "next/link";
import { fitTitleStyle } from "@/utils/fit-title";
import { formatEventTime } from "@/features/events/domain/event-format";
import { useUpcomingEvents } from "@/features/events/hooks/use-events";
import { useActiveSeries } from "../hooks/use-community";

/** Home (2c): "SERIE · CONFORME A SU CORAZÓN · Continuar serie →". */
export function HomeSeriesCard() {
  const series = useActiveSeries();
  const s = series.data;
  if (!s) return null;
  const inner = (
    <>
      <span className="flex h-[92px] w-[72px] flex-none items-center justify-center rounded-[14px] bg-ink font-display-x text-[26px] text-stage-encuentra">
        {String(s.current_topic).padStart(2, "0")}
      </span>
      <span className="flex min-w-0 flex-col gap-1.5">
        <span className="font-mono text-[10px] font-semibold tracking-[.08em] text-ink/50 uppercase">
          Serie · {s.title}
        </span>
        <span className="text-[17px] leading-[1.2] font-bold">
          {s.current_title ?? `Tema ${s.current_topic} de ${s.total_topics}`}
        </span>
        {s.plan_id ? <span className="text-[13px] font-bold text-violet">Continuar serie →</span> : null}
      </span>
    </>
  );
  const cls = "flex items-center gap-4 rounded-[26px] bg-white p-5";
  return s.plan_id ? (
    <Link href={`/plan/?id=${s.plan_id}`} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/** Home (2c): next church event, "Ver evento". */
export function HomeEventCard() {
  const events = useUpcomingEvents(1);
  const e = events.data?.[0];
  if (!e) return null;
  const when = formatEventTime(e.starts_at);
  return (
    <Link
      href={`/evento/?id=${e.id}`}
      className="photo-ink flex h-[190px] flex-col justify-end rounded-[30px] p-5 text-white"
    >
      <span className="flex items-end justify-between gap-3">
        <span className="@container flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-display-x text-[22px] leading-[.95]" style={fitTitleStyle(e.title, 22)}>
            {e.title}
          </span>
          <span className="text-[13px] font-semibold text-stage-encuentra first-letter:uppercase">{when}</span>
        </span>
        <span className="flex h-10 flex-none items-center rounded-full bg-white px-4 text-[13px] font-semibold text-ink">
          Ver evento
        </span>
      </span>
    </Link>
  );
}
