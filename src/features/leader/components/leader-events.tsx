"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { eventsRepository } from "@/features/events/data/events.repository";
import { formatEventDates } from "@/features/events/domain/event-format";
import { useLeaderChurch } from "../hooks/use-leader";
import { LeaderNoChurch } from "./leader-dashboard";

const input = "h-11 rounded-xl border-[1.5px] border-ink/15 bg-white px-3 text-sm focus:border-ink focus:outline-none";

/** Eventos: create and publish church events; see registration counts. */
export function LeaderEvents() {
  const { churchId, isPending } = useLeaderChurch();
  const queryClient = useQueryClient();
  const events = useQuery({
    queryKey: ["leader", "events", churchId],
    queryFn: () => eventsRepository.all(churchId!),
    enabled: Boolean(churchId),
  });
  const counts = useQuery({
    queryKey: ["leader", "events", "counts", (events.data ?? []).map((e) => e.id).join(",")],
    queryFn: () => eventsRepository.registrationsCount((events.data ?? []).map((e) => e.id)),
    enabled: Boolean(events.data?.length),
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["leader", "events"] });
    void queryClient.invalidateQueries({ queryKey: ["events"] });
  };
  const create = useMutation({ mutationFn: eventsRepository.create, onSuccess: refresh });
  const update = useMutation({
    mutationFn: (v: { id: string; patch: Parameters<typeof eventsRepository.update>[1] }) =>
      eventsRepository.update(v.id, v.patch),
    onSuccess: refresh,
  });
  const [f, setF] = useState({ title: "", starts: "", ends: "", place: "", cost: "", capacity: "", description: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  if (!isPending && !churchId) return <LeaderNoChurch />;

  return (
    <>
      <h1 className="m-0 font-display-x text-[40px] leading-[.9] tracking-[-.02em]">Eventos</h1>
      <form
        className="grid gap-2 rounded-3xl bg-white p-[22px] md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate(
            {
              church_id: churchId!,
              title: f.title.trim(),
              starts_at: new Date(f.starts).toISOString(),
              ends_at: f.ends ? new Date(f.ends).toISOString() : null,
              location_name: f.place.trim() || null,
              cost_text: f.cost.trim() || null,
              capacity: f.capacity ? Number(f.capacity) : null,
              description: f.description.trim() || null,
            },
            {
              onSuccess: () =>
                setF({ title: "", starts: "", ends: "", place: "", cost: "", capacity: "", description: "" }),
            },
          );
        }}
      >
        <h2 className="m-0 text-[17px] font-bold md:col-span-2">Nuevo evento</h2>
        <input
          aria-label="Título"
          placeholder="Campamento 2026"
          className={input}
          maxLength={80}
          value={f.title}
          onChange={set("title")}
        />
        <input
          aria-label="Lugar"
          placeholder="Lugar"
          className={input}
          maxLength={120}
          value={f.place}
          onChange={set("place")}
        />
        <label className="flex flex-col gap-1 text-xs font-semibold">
          Empieza
          <input type="datetime-local" className={input} value={f.starts} onChange={set("starts")} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          Termina (opcional)
          <input type="datetime-local" className={input} value={f.ends} onChange={set("ends")} />
        </label>
        <input
          aria-label="Costo"
          placeholder="Costo (ej. $1,200 MXN)"
          className={input}
          maxLength={40}
          value={f.cost}
          onChange={set("cost")}
        />
        <input
          aria-label="Cupo"
          placeholder="Cupo (opcional)"
          type="number"
          min={1}
          className={input}
          value={f.capacity}
          onChange={set("capacity")}
        />
        <textarea
          aria-label="Descripción"
          placeholder="Descripción"
          rows={3}
          maxLength={2000}
          value={f.description}
          onChange={set("description")}
          className="rounded-xl border-[1.5px] border-ink/15 p-3 text-sm md:col-span-2"
        />
        <p className="m-0 text-xs text-ink/55 md:col-span-2">
          Usa un lugar público. Los jóvenes solo verán cuántas personas van, no quiénes.
        </p>
        {create.isError ? (
          <p role="alert" className="m-0 text-sm text-coral md:col-span-2">
            {create.error.message}
          </p>
        ) : null}
        <Button
          type="submit"
          variant="ink"
          size="md"
          className="md:col-span-2 md:justify-self-start"
          disabled={f.title.trim().length < 2 || !f.starts || (Boolean(f.ends) && f.ends < f.starts)}
          loading={create.isPending}
        >
          Publicar evento
        </Button>
      </form>

      <section className="flex flex-col gap-3 rounded-3xl bg-white p-[22px]" aria-label="Eventos publicados">
        {events.isPending ? <Skeleton className="h-16 rounded-2xl" /> : null}
        {events.data?.map((e) => (
          <div
            key={e.id}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/[.06] pb-3 last:border-0"
          >
            <span className="flex flex-col">
              <span className="text-sm font-semibold">{e.title}</span>
              <span className="text-xs text-ink/55">
                {formatEventDates(e.starts_at, e.ends_at)} · {counts.data?.[e.id] ?? 0} inscritos
                {e.capacity ? ` de ${e.capacity}` : ""}
              </span>
            </span>
            <span className="flex gap-1.5">
              <button
                type="button"
                onClick={() => update.mutate({ id: e.id, patch: { registration_open: !e.registration_open } })}
                className="flex h-9 items-center rounded-full border-[1.5px] border-ink/20 px-3 text-xs font-semibold"
              >
                {e.registration_open ? "Cerrar inscripciones" : "Abrir inscripciones"}
              </button>
              <button
                type="button"
                onClick={() => update.mutate({ id: e.id, patch: { is_published: !e.is_published } })}
                className={`flex h-9 items-center rounded-full px-3 text-xs font-semibold ${e.is_published ? "bg-stage-crece" : "border-[1.5px] border-ink/20"}`}
              >
                {e.is_published ? "Publicado" : "Oculto"}
              </button>
            </span>
          </div>
        ))}
      </section>
    </>
  );
}
