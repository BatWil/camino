"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { GiftArea } from "@/lib/supabase/database.types";
import { serviceRepository } from "@/features/service/data/service.repository";
import { GIFT_AREAS, GIFT_LABEL } from "@/features/service/domain/gifts";
import { useLeaderChurch } from "../hooks/use-leader";
import { shortName } from "../domain/leader";
import { LeaderNoChurch } from "./leader-dashboard";

const input = "h-11 rounded-xl border-[1.5px] border-ink/15 bg-white px-3 text-sm focus:border-ink focus:outline-none";

/** Servicio: "Me interesa" requests and service opportunities. */
export function LeaderService() {
  const { churchId, isPending } = useLeaderChurch();
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["leader"] });
    void queryClient.invalidateQueries({ queryKey: ["service"] });
  };
  const requests = useQuery({
    queryKey: ["leader", "service-requests", churchId],
    queryFn: () => serviceRepository.leaderRequests(churchId!),
    enabled: Boolean(churchId),
  });
  const opportunities = useQuery({
    queryKey: ["leader", "opportunities", churchId],
    queryFn: () => serviceRepository.allOpportunities(churchId!),
    enabled: Boolean(churchId),
  });
  const decide = useMutation({
    mutationFn: (v: { id: string; accept: boolean }) => serviceRepository.decide(v.id, v.accept),
    onSuccess: refresh,
  });
  const create = useMutation({ mutationFn: serviceRepository.createOpportunity, onSuccess: refresh });
  const toggle = useMutation({
    mutationFn: (v: { id: string; open: boolean }) => serviceRepository.setOpportunityOpen(v.id, v.open),
    onSuccess: refresh,
  });
  const [title, setTitle] = useState("");
  const [schedule, setSchedule] = useState("");
  const [area, setArea] = useState<GiftArea>("service");
  const [spots, setSpots] = useState("");

  if (!isPending && !churchId) return <LeaderNoChurch />;

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 font-display-x text-[40px] leading-[.9] tracking-[-.02em]">Servicio</h1>
        <p className="m-0 text-sm text-ink/60">
          Quién quiere servir y dónde. Los resultados del test de dones son privados.
        </p>
      </div>

      <section className="flex flex-col gap-3 rounded-3xl bg-white p-[22px]" aria-labelledby="sr-title">
        <h2 id="sr-title" className="m-0 text-[17px] font-bold">
          Quieren servir
        </h2>
        {requests.isPending ? <Skeleton className="h-16 rounded-2xl" /> : null}
        {requests.data && !requests.data.length ? <span className="text-sm text-ink/60">Sin solicitudes.</span> : null}
        {requests.data?.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/[.06] pb-3 last:border-0"
          >
            <span className="text-sm font-semibold">
              {shortName(r.person)} · {r.opportunity}
            </span>
            {r.status === "pending" ? (
              <span className="flex gap-1.5">
                <Button
                  variant="ink"
                  size="sm"
                  className="h-9 px-3 text-xs"
                  loading={decide.isPending && decide.variables?.id === r.id}
                  onClick={() => decide.mutate({ id: r.id, accept: true })}
                >
                  Aceptar
                </Button>
                <button
                  type="button"
                  onClick={() => decide.mutate({ id: r.id, accept: false })}
                  className="flex h-9 items-center rounded-full border-[1.5px] border-ink/20 px-3 text-xs font-semibold"
                >
                  Ahora no
                </button>
              </span>
            ) : (
              <span className="text-xs font-semibold text-ink/55">
                {r.status === "accepted" ? "Aceptado ✓" : "No por ahora"}
              </span>
            )}
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-3xl bg-white p-[22px]" aria-labelledby="op-title">
        <h2 id="op-title" className="m-0 text-[17px] font-bold">
          Oportunidades
        </h2>
        <form
          className="grid gap-2 md:grid-cols-[2fr_1.5fr_1fr_.7fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(
              {
                church_id: churchId!,
                title: title.trim(),
                schedule_text: schedule.trim() || null,
                area,
                spots: spots ? Number(spots) : null,
              },
              {
                onSuccess: () => {
                  setTitle("");
                  setSchedule("");
                  setSpots("");
                },
              },
            );
          }}
        >
          <input
            aria-label="Nombre"
            placeholder="Multimedia"
            className={input}
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            aria-label="Horario"
            placeholder="Sábados · capacitación incluida"
            className={input}
            value={schedule}
            maxLength={80}
            onChange={(e) => setSchedule(e.target.value)}
          />
          <select
            aria-label="Área"
            className={input}
            value={area}
            onChange={(e) => setArea(e.target.value as GiftArea)}
          >
            {GIFT_AREAS.map((a) => (
              <option key={a} value={a}>
                {GIFT_LABEL[a]}
              </option>
            ))}
          </select>
          <input
            aria-label="Lugares"
            placeholder="Lugares"
            type="number"
            min={1}
            max={500}
            className={input}
            value={spots}
            onChange={(e) => setSpots(e.target.value)}
          />
          <Button
            type="submit"
            variant="ink"
            size="sm"
            className="h-11"
            disabled={title.trim().length < 2}
            loading={create.isPending}
          >
            Agregar
          </Button>
        </form>
        {create.isError ? (
          <p role="alert" className="m-0 text-sm text-coral">
            {create.error.message}
          </p>
        ) : null}
        {opportunities.data?.map((o) => (
          <div
            key={o.id}
            className="flex items-center justify-between gap-2 border-b border-ink/[.06] pb-3 last:border-0"
          >
            <span className="flex flex-col">
              <span className="text-sm font-semibold">{o.title}</span>
              <span className="text-xs text-ink/55">
                {[GIFT_LABEL[o.area], o.schedule_text, o.spots ? `${o.spots} lugares` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            <button
              type="button"
              onClick={() => toggle.mutate({ id: o.id, open: !o.is_open })}
              className={`flex h-9 items-center rounded-full px-3 text-xs font-semibold ${o.is_open ? "bg-stage-crece" : "border-[1.5px] border-ink/20"}`}
            >
              {o.is_open ? "Abierta" : "Cerrada"}
            </button>
          </div>
        ))}
      </section>
    </>
  );
}
