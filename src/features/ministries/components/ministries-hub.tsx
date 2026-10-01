"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { conferenceDatesShort } from "@/features/conferences/domain/conference";
import { useFeaturedConference } from "@/features/conferences/hooks/use-conferences";
import { fitTitleStyle } from "@/utils/fit-title";
import { PROGRAMS } from "../domain/programs";

/** Screen 8a · Ministerios · Ganar / Edificar / Enviar / Liderar. */
export function MinistriesHub() {
  const conf = useFeaturedConference();
  const c = conf.data;
  return (
    <div className="bleed-nav min-h-dvh bg-ink text-paper">
      <header className="@container flex flex-col gap-2.5 px-6 pt-[18px] pb-[18px]">
        <h1
          className="m-0 font-display-x text-[42px] leading-[.85] tracking-[-.03em]"
          style={fitTitleStyle("Ministerios", 42)}
        >
          Ministerios
        </h1>
        <span className="font-mono text-xs font-semibold tracking-[.08em] text-lime">
          GANAR / EDIFICAR / ENVIAR / LIDERAR
        </span>
      </header>

      <div className="stagger grid grid-cols-2 gap-2.5 px-3">
        {conf.isPending ? <Skeleton className="col-span-2 h-[150px] rounded-[26px] bg-white/10" /> : null}
        {c ? (
          <Link
            href={`/conferencia/?id=${c.id}`}
            className="@container col-span-2 flex h-[150px] flex-col justify-between rounded-[26px] bg-lime p-[18px] text-ink"
          >
            <span className="flex justify-between">
              <span className="eyebrow">
                {c.title.toLowerCase().includes("nacional") ? "Conferencia Nacional" : "Conferencia"} ·{" "}
                {conferenceDatesShort(c.starts_on, c.ends_on)}
              </span>
              <span className="text-lg" aria-hidden>
                →
              </span>
            </span>
            <span
              className="font-display-x text-[26px] leading-[.9] whitespace-pre-line"
              style={fitTitleStyle(c.hub_title ?? c.title, 26)}
            >
              {(c.hub_title ?? c.title).replace(/\? /, "?\n")}
            </span>
          </Link>
        ) : null}

        {PROGRAMS.map((p) => (
          <Link
            key={p.id}
            href={p.href}
            className="@container flex h-[140px] flex-col justify-between rounded-3xl p-4"
            style={{ background: p.bg, color: p.fg }}
          >
            <span className="font-mono text-[10px] font-semibold">{p.pillar}</span>
            <span className="font-display-x text-base leading-[.95]" style={fitTitleStyle(p.title, 16)}>
              {p.title}
            </span>
          </Link>
        ))}

        <Link
          href="/llamados"
          className="col-span-2 flex items-center justify-between rounded-3xl bg-white/[.08] p-[18px]"
        >
          <span className="flex flex-col gap-1">
            <span className="eyebrow text-lime">Liderar</span>
            <span className="text-[17px] font-bold">Llamados · ¿Dios te llama al ministerio?</span>
          </span>
          <span className="text-lg" aria-hidden>
            →
          </span>
        </Link>
        <Link
          href="/recursos"
          className="col-span-2 flex items-center justify-between rounded-3xl bg-white/[.08] p-[18px]"
        >
          <span className="flex flex-col gap-1">
            <span className="eyebrow text-lime">Recursos</span>
            <span className="text-[17px] font-bold">Diario guiado y libros</span>
          </span>
          <span className="text-lg" aria-hidden>
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
