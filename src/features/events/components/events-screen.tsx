"use client";

import { EventMorph } from "./event-morph";
import Link from "next/link";
import { ScreenHeader } from "@/components/ui/screen-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/feedback/state-view";
import { formatEventDates } from "../domain/event-format";
import { useMyRegistrations, useUpcomingEvents } from "../hooks/use-events";

/** All upcoming events of my church. */
export function EventsScreen() {
  const events = useUpcomingEvents(50);
  const regs = useMyRegistrations();
  const registered = new Set((regs.data ?? []).filter((r) => r.status !== "cancelled").map((r) => r.event_id));

  return (
    <div className="flex flex-col gap-2.5">
      <ScreenHeader title="Eventos" subtitle="De tu iglesia" />
      <div className="stagger flex flex-col gap-2.5 px-3">
        {events.isPending ? <Skeleton className="h-24 rounded-[22px]" /> : null}
        {events.isError ? <StateView kind="error" message={events.error.message} /> : null}
        {events.data && !events.data.length ? (
          <StateView
            kind="empty"
            title="Sin eventos por ahora"
            message="Cuando tu iglesia publique uno, aparecerá aquí."
          />
        ) : null}
        {events.data?.map((e) => (
          <EventMorph key={e.id} id={e.id}>
            <Link
              href={`/evento/?id=${e.id}`}
              className="flex items-center justify-between gap-3 rounded-[22px] bg-white px-[18px] py-4"
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span className="font-mono text-[11px] font-semibold text-violet">
                  {formatEventDates(e.starts_at, e.ends_at)}
                </span>
                <span className="text-base font-bold">{e.title}</span>
                {e.location_name ? <span className="text-xs text-ink/55">{e.location_name}</span> : null}
              </span>
              <span
                className={`flex h-9 flex-none items-center rounded-full px-3.5 text-xs font-semibold ${
                  registered.has(e.id) ? "bg-stage-crece" : "bg-ink text-white"
                }`}
              >
                {registered.has(e.id) ? "Inscrito ✓" : "Ver"}
              </span>
            </Link>
          </EventMorph>
        ))}
      </div>
    </div>
  );
}
