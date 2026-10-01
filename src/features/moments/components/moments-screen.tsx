"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { TextField } from "@/components/ui/text-field";
import { ScreenHeader } from "@/components/ui/screen-header";
import { StateView } from "@/components/feedback/state-view";
import { localIsoDate } from "@/features/rhythm/domain/rhythm";
import type { MomentKind } from "@/lib/supabase/database.types";
import { cn } from "@/utils/cn";
import { MANUAL_KINDS, MOMENT_META, groupByYear } from "../domain/moments";
import { useMomentMutations, useMoments } from "../hooks/use-moments";

function AddMoment({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { add } = useMomentMutations();
  const [kind, setKind] = useState<MomentKind>("faith_decision");
  const [title, setTitle] = useState(MOMENT_META.faith_decision.label);
  const [date, setDate] = useState(localIsoDate(new Date()));
  const [note, setNote] = useState("");

  return (
    <Sheet open={open} onClose={onClose} title="Nuevo momento">
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Tipo de momento">
        {MANUAL_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => {
              setKind(k);
              setTitle(MOMENT_META[k].label);
            }}
            className={cn(
              "rounded-full px-3 py-2 text-[13px] font-semibold",
              kind === k ? "bg-ink text-white" : "bg-white",
            )}
          >
            {MOMENT_META[k].label}
          </button>
        ))}
      </div>
      <TextField tone="light" label="Título" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
      <TextField
        tone="light"
        label="Fecha"
        type="date"
        value={date}
        max={localIsoDate(new Date())}
        onChange={(e) => setDate(e.target.value)}
      />
      <div className="flex flex-col gap-2">
        <label htmlFor="moment-note" className="text-sm font-semibold">
          ¿Qué pasó? (opcional)
        </label>
        <textarea
          id="moment-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          rows={3}
          className="rounded-[22px] border-[1.5px] border-ink/15 bg-white p-4 text-base focus:border-ink focus:outline-none"
        />
      </div>
      <Button
        variant="ink"
        size="lg"
        block
        disabled={!title.trim() || !date}
        loading={add.isPending}
        onClick={() =>
          add.mutate(
            { kind, title: title.trim(), note: note.trim() || null, happened_on: date },
            {
              onSuccess: () => {
                setNote("");
                onClose();
              },
            },
          )
        }
      >
        Guardar momento
      </Button>
    </Sheet>
  );
}

/** "Momentos de mi camino" — a personal, private timeline. */
export function MomentsScreen() {
  const moments = useMoments();
  const { remove } = useMomentMutations();
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col pb-6">
      <ScreenHeader title="Momentos" subtitle="De mi camino · solo tú los ves" />
      <div className="px-5">
        {moments.isPending ? (
          <Skeleton className="h-60" />
        ) : moments.isError ? (
          <StateView
            kind="error"
            action={
              <Button variant="ink" size="sm" onClick={() => moments.refetch()}>
                Reintentar
              </Button>
            }
          />
        ) : moments.data.length === 0 ? (
          <StateView
            kind="empty"
            title="Tu historia empieza aquí"
            message="Guarda los momentos importantes: una decisión, tu bautismo, la primera vez que serviste…"
          />
        ) : (
          groupByYear(moments.data).map(({ year, items }) => (
            <section key={year} aria-labelledby={`y${year}`} className="pb-4">
              <h2 id={`y${year}`} className="m-0 pb-3 font-display-x text-[34px]">
                {year}
              </h2>
              <ol className="relative m-0 flex list-none flex-col gap-4 border-l-2 border-ink/15 p-0 pl-6">
                {items.map((m) => (
                  <li key={m.id} className="relative">
                    <span
                      className="absolute top-1 -left-[33px] size-4 rounded-full border-2 border-ink"
                      style={{ background: MOMENT_META[m.kind].color }}
                      aria-hidden
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[15px] font-bold">{m.title}</span>
                        <span className="text-xs text-ink/55">
                          {new Date(`${m.happened_on}T12:00:00`).toLocaleDateString("es", {
                            day: "numeric",
                            month: "long",
                          })}
                          {m.is_auto ? " · automático" : ""}
                        </span>
                        {m.note ? <p className="m-0 pt-1 text-sm text-ink/75">{m.note}</p> : null}
                      </div>
                      {!m.is_auto ? (
                        <button
                          type="button"
                          onClick={() => window.confirm("¿Borrar este momento?") && remove.mutate(m.id)}
                          className="text-xs font-semibold text-ink/45"
                        >
                          Borrar
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))
        )}
        <Button
          variant="ghost"
          size="md"
          block
          className="mt-2 h-[52px] gap-2 border-[1.5px] border-ink/20"
          onClick={() => setAdding(true)}
        >
          <Plus className="size-4" aria-hidden /> Agregar un momento
        </Button>
      </div>
      <AddMoment open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}
