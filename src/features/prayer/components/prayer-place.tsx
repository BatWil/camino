"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/feedback/state-view";
import { useMyGroups } from "@/features/churches/hooks/use-access";
import { cn } from "@/utils/cn";
import { DURATIONS, GUIDE } from "../domain/prayer";
import { useMyPrayers } from "../hooks/use-prayers";
import { PrayerCard } from "./prayer-card";

const RECENT_MS = 7 * 86_400_000;

/** Screen 2f · "Mi lugar de oración". */
export function PrayerPlace() {
  const prayers = useMyPrayers();
  const groups = useMyGroups();
  const [tab, setTab] = useState<"private" | "shared">("private");
  const [duration, setDuration] = useState<string>("10");
  const [now] = useState(() => Date.now());

  const all = prayers.data ?? [];
  const visible = all.filter((p) => {
    const sharedKind = p.privacy === "GROUP" || p.privacy === "CHURCH";
    const inTab = tab === "shared" ? sharedKind : !sharedKind;
    const active =
      p.status === "PRAYING" ||
      (p.status === "ANSWERED" && p.answered_at && now - new Date(p.answered_at).getTime() < RECENT_MS);
    return inTab && active;
  });
  const year = new Date().getFullYear();
  const answered = all.filter((p) => p.status === "ANSWERED" && p.answered_at);
  const thisYear = answered.filter((p) => new Date(p.answered_at!).getFullYear() === year);
  const latest = [...answered].sort((a, b) => b.answered_at!.localeCompare(a.answered_at!))[0];
  const groupName = (id: string | null) => groups.data?.find((g) => g.groupId === id)?.name;

  return (
    <div className="flex flex-col pb-6">
      <header className="px-6 py-[18px]">
        <h1 className="m-0 font-display-x text-[40px] leading-[.88] tracking-[-.03em]">
          Mi lugar
          <br />
          de oración
        </h1>
      </header>

      <section
        className="mx-3 flex flex-col gap-4 rounded-[30px] bg-ink p-[22px] text-paper"
        aria-labelledby="prayer-mode"
      >
        <div className="flex items-center justify-between">
          <h2 id="prayer-mode" className="m-0 text-xl font-bold">
            Modo oración
          </h2>
          <span className="font-mono text-[10px] font-semibold text-paper/50">SIN DISTRACCIONES</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Duración">
          {DURATIONS.map((d) => (
            <button
              key={d.id}
              type="button"
              role="radio"
              aria-checked={duration === d.id}
              onClick={() => setDuration(d.id)}
              className={cn(
                "h-12 rounded-[14px] font-semibold",
                duration === d.id ? "bg-stage-comparte font-bold" : "bg-white/[.08]",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        <span className="text-[13px] text-paper/60">{GUIDE.map((g) => g.title).join(" · ")}</span>
        <Link
          href={`/oracion/modo/?min=${duration}`}
          className="flex h-[50px] items-center justify-center rounded-full bg-lime text-[15px] font-bold text-ink"
        >
          Comenzar
        </Link>
      </section>

      <div className="flex items-center justify-between px-6 pt-6 pb-2.5">
        <h2 className="m-0 text-[17px] font-bold">Mis peticiones</h2>
        <div
          className="flex gap-1 rounded-full bg-white p-1 text-xs font-semibold"
          role="tablist"
          aria-label="Privacidad"
        >
          {(["private", "shared"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn("rounded-full px-2.5 py-1.5", tab === t ? "bg-ink text-white" : "text-ink/55")}
            >
              {t === "private" ? "Privadas" : "Compartidas"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-3">
        {prayers.isPending ? (
          <Skeleton className="h-36" />
        ) : prayers.isError ? (
          <StateView
            kind="error"
            action={
              <Button variant="ink" size="sm" onClick={() => prayers.refetch()}>
                Reintentar
              </Button>
            }
          />
        ) : visible.length === 0 ? (
          <StateView
            kind="empty"
            title={tab === "private" ? "Tu lugar está listo" : "Nada compartido"}
            message={
              tab === "private"
                ? "Escribe por qué quieres orar. Tus peticiones son privadas a menos que tú decidas compartirlas."
                : "Puedes compartir una petición con tu grupo o tu iglesia cuando quieras."
            }
          />
        ) : (
          visible.map((p) => <PrayerCard key={p.id} prayer={p} groupName={groupName(p.group_id)} />)
        )}
        <Link
          href="/oracion/peticion/"
          className="flex h-[52px] items-center justify-center gap-2 rounded-full border-[1.5px] border-ink/20 text-sm font-semibold"
        >
          <Plus className="size-4" aria-hidden /> Nueva petición
        </Link>
      </div>

      {answered.length ? (
        <section aria-labelledby="answered-title">
          <h2 id="answered-title" className="m-0 px-6 pt-6 pb-2.5 text-[17px] font-bold">
            ✦ Oraciones respondidas
          </h2>
          <div className="flex gap-2.5 px-3">
            <div className="flex flex-1 flex-col gap-1.5 rounded-[22px] bg-lime p-4">
              <span className="font-display-x text-[26px]">{thisYear.length}</span>
              <span className="text-[13px] font-semibold">este año</span>
            </div>
            {latest ? (
              <Link
                href={`/oracion/peticion/?id=${latest.id}`}
                className="flex flex-[2] flex-col gap-1.5 rounded-[22px] bg-white p-4"
              >
                <span className="text-sm font-bold">{latest.title}</span>
                <span className="text-xs text-ink/60">
                  Respondida en {new Date(latest.answered_at!).toLocaleDateString("es", { month: "long" })}
                </span>
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
