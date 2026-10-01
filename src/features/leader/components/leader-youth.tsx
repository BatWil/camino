"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaderChurch, useLeaderRequests, useLeaderYouth } from "../hooks/use-leader";
import { shortName } from "../domain/leader";
import { LeaderNoChurch } from "./leader-dashboard";
import { YouthTable } from "./youth-table";

const select = "h-9 rounded-full border-[1.5px] border-ink/20 bg-white px-3 text-xs font-semibold";

/** Jóvenes: accompaniment data, mentor assignment (audited) and conversation requests. */
export function LeaderYouth() {
  const { churchId, isPending } = useLeaderChurch();
  const youth = useLeaderYouth();
  const { requests, setStatus, assign } = useLeaderRequests();
  const [choice, setChoice] = useState<Record<string, string>>({});
  const mentors = (youth.data ?? []).filter((y) => y.is_mentor);

  if (!isPending && !churchId) return <LeaderNoChurch />;

  const assignControl = (menteeId: string, where: "req" | "row", onDone?: () => void) => {
    const options = mentors.filter((m) => m.user_id !== menteeId);
    if (!options.length) return <span className="text-xs text-ink/50">Sin mentores</span>;
    return (
      <span className="flex items-center gap-1.5">
        <label className="sr-only" htmlFor={`mentor-${where}-${menteeId}`}>
          Mentor
        </label>
        <select
          id={`mentor-${where}-${menteeId}`}
          className={select}
          value={choice[menteeId] ?? ""}
          onChange={(e) => setChoice((c) => ({ ...c, [menteeId]: e.target.value }))}
        >
          <option value="">Elegir mentor</option>
          {options.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.name}
            </option>
          ))}
        </select>
        <Button
          variant="ink"
          size="sm"
          className="h-9 px-3 text-xs"
          disabled={!choice[menteeId]}
          loading={assign.isPending && assign.variables?.menteeId === menteeId}
          onClick={() => assign.mutate({ mentorId: choice[menteeId], menteeId }, { onSuccess: onDone })}
        >
          Asignar
        </Button>
      </span>
    );
  };

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 font-display-x text-[40px] leading-[.9] tracking-[-.02em]">Jóvenes</h1>
        <p className="m-0 text-sm text-ink/60">
          Etapa, plan actual, participación aproximada, grupo y mentor. Nunca su diario, oraciones privadas ni notas.
        </p>
      </div>

      <section
        id="mentores"
        className="flex scroll-mt-6 flex-col gap-3 rounded-3xl bg-white p-[22px]"
        aria-labelledby="req-title"
      >
        <h2 id="req-title" className="m-0 text-[17px] font-bold">
          Piden conversación
        </h2>
        {requests.isPending ? <Skeleton className="h-16 rounded-2xl" /> : null}
        {requests.data && !requests.data.length ? (
          <span className="text-sm text-ink/60">No hay solicitudes abiertas.</span>
        ) : null}
        {requests.data?.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/[.06] pb-3 last:border-0"
          >
            <span className="flex flex-col">
              <span className="text-sm font-semibold">
                {shortName(r.person)} ·{" "}
                {r.with_role === "mentor"
                  ? "quiere un mentor"
                  : r.with_role === "pastor"
                    ? "con el pastor"
                    : "con un líder"}
              </span>
              <span className="text-xs text-ink/55">
                {r.status === "scheduled" ? "Agendada" : "Abierta"}
                {r.has_mentor ? " · ya tiene mentor" : ""}
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-1.5">
              {r.with_role === "mentor" && !r.has_mentor
                ? assignControl(r.user_id, "req", () => setStatus.mutate({ id: r.id, status: "closed" }))
                : null}
              {r.status === "open" && r.with_role !== "mentor" ? (
                <Button
                  variant="ink"
                  size="sm"
                  className="h-9 px-3 text-xs"
                  onClick={() => setStatus.mutate({ id: r.id, status: "scheduled" })}
                >
                  Agendada
                </Button>
              ) : null}
              <button
                type="button"
                onClick={() => setStatus.mutate({ id: r.id, status: "closed" })}
                className="flex h-9 items-center rounded-full border-[1.5px] border-ink/20 px-3 text-xs font-semibold"
              >
                Cerrar
              </button>
            </span>
          </div>
        ))}
        {assign.isError ? (
          <p role="alert" className="m-0 text-sm font-semibold text-coral">
            {assign.error.message}
          </p>
        ) : null}
      </section>

      <section className="rounded-3xl bg-white p-[22px]" aria-label="Lista de jóvenes">
        {youth.isPending ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : (
          <YouthTable
            rows={youth.data ?? []}
            showMentor
            renderAction={(r) => (r.mentor_name ? null : assignControl(r.user_id, "row"))}
          />
        )}
        <p className="mt-3 mb-0 text-xs text-ink/55">
          Asignar un mentor queda registrado en la auditoría. El pastor puede revisar las conversaciones de mentoría por
          seguridad; tú no.
        </p>
      </section>
    </>
  );
}
