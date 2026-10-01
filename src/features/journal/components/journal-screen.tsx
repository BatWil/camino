"use client";

import { useState } from "react";
import Link from "next/link";
import { CloudOff } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/feedback/state-view";
import type { JournalKind } from "@/lib/supabase/database.types";
import { cn } from "@/utils/cn";
import { FILTERS, KIND_META, dayLabel, promptFor, timeLabel } from "../domain/journal";
import { useJournal, useJournalSync } from "../hooks/use-journal";

/** Screen 5d · Diario · privado. */
export function JournalScreen() {
  const [filter, setFilter] = useState<"all" | JournalKind>("all");
  const entries = useJournal(filter);
  useJournalSync();
  const today = new Date();
  const prompt = promptFor(today);

  return (
    <div className="bleed-nav min-h-dvh bg-ink text-paper">
      <header className="flex items-end justify-between px-6 pt-[18px] pb-3.5">
        <h1 className="m-0 font-display-x text-[44px] leading-[.85] tracking-[-.03em]">
          Mi
          <br />
          diario
        </h1>
        <span className="rounded-full bg-lime/15 px-3 py-2 font-mono text-[11px] font-semibold tracking-[.06em] text-lime">
          ● SOLO TÚ
        </span>
      </header>

      <div className="flex flex-col gap-2.5 px-3">
        <section className="flex flex-col gap-2.5 rounded-[26px] bg-lime p-5 text-ink" aria-labelledby="today-prompt">
          <span className="eyebrow">Pregunta de hoy</span>
          <h2 id="today-prompt" className="m-0 text-xl leading-[1.2] font-bold">
            {prompt}
          </h2>
          <ButtonLink
            href={`/diario/entrada/?pregunta=${encodeURIComponent(prompt)}`}
            variant="ink"
            size="sm"
            className="h-11 self-start px-[18px] text-sm"
          >
            Escribir
          </ButtonLink>
        </section>

        <div
          className="flex gap-1.5 overflow-x-auto px-1 py-2 [scrollbar-width:none]"
          role="tablist"
          aria-label="Filtrar"
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "flex-none rounded-full px-3 py-2 text-xs font-semibold",
                filter === f.id ? "bg-paper text-ink" : "border border-paper/25",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {entries.isPending ? (
          Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28 rounded-[22px] opacity-20" />)
        ) : entries.isError ? (
          <StateView kind="error" tone="dark" message="No pudimos abrir tu diario." />
        ) : entries.data.length === 0 ? (
          <StateView
            kind="empty"
            tone="dark"
            title={filter === "all" ? "Tu diario está esperando" : "Nada aquí todavía"}
            message="Lo que escribas aquí es solo tuyo. Ni tus líderes ni nadie más puede leerlo."
            className="border border-paper/10"
          />
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {entries.data.map((e) => {
              const meta = KIND_META[e.kind];
              const label = e.kind === "verse" && e.verse_ref ? e.verse_ref.toUpperCase() : meta.label.toUpperCase();
              const isVerse = e.kind === "verse" && e.verse_text;
              return (
                <li key={e.id}>
                  <Link
                    href={e.pendingSync ? "#" : `/diario/entrada/?id=${e.id}`}
                    className="flex flex-col gap-2 rounded-[22px] bg-white/[.06] p-[18px]"
                    aria-disabled={e.pendingSync}
                  >
                    <div className="flex justify-between gap-3">
                      <span className="eyebrow" style={{ color: meta.color }}>
                        {dayLabel(e.entry_date, today)} · {label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-paper/50">
                        {e.pendingSync ? <CloudOff className="size-3.5" aria-label="Pendiente de sincronizar" /> : null}
                        {timeLabel(e.created_at)}
                      </span>
                    </div>
                    {isVerse ? (
                      <span className="font-serif text-[15px] leading-normal text-paper/85 italic">
                        “{e.verse_text}”
                      </span>
                    ) : null}
                    <span className="line-clamp-3 text-[15px] leading-normal text-paper/85">{e.body}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
