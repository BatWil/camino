"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { hasAnyRole } from "@/features/churches/domain/access";
import { useAccess } from "@/features/churches/hooks/use-access";
import { fineArtsRepository, type LeaderEntry } from "@/features/fine-arts/data/fine-arts.repository";
import { categoryLabel, STATUS_LABEL } from "@/features/fine-arts/domain/fine-arts";
import { missionsRepository } from "@/features/missions/data/missions.repository";
import { money, progressPercent } from "@/features/missions/domain/missions";
import type { MissionProgram } from "@/lib/supabase/database.types";
import { useLeaderChurch } from "../hooks/use-leader";
import { shortName } from "../domain/leader";
import { LeaderNoChurch } from "./leader-dashboard";

const input = "h-11 rounded-xl border-[1.5px] border-ink/15 bg-white px-3 text-sm focus:border-ink focus:outline-none";

function EntryRow({ e, onDone }: { e: LeaderEntry; onDone: () => void }) {
  const [note, setNote] = useState("");
  const review = useMutation({
    mutationFn: (approve: boolean) => fineArtsRepository.review(e.id, approve, note.trim() || null),
    onSuccess: onDone,
  });
  const open = useMutation({
    mutationFn: () => fineArtsRepository.signedUrl(e.file_path!),
    onSuccess: (url) => window.open(url, "_blank", "noopener,noreferrer"),
  });
  return (
    <div className="flex flex-col gap-2 border-b border-ink/[.06] pb-3 last:border-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">
          {shortName(e.person)} · {categoryLabel(e.category)}
        </span>
        <span className="flex items-center gap-2">
          {e.file_path ? (
            <button type="button" onClick={() => open.mutate()} className="text-xs font-semibold text-violet">
              Ver archivo
            </button>
          ) : null}
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${e.status === "approved" ? "bg-stage-crece" : "bg-paper"}`}
          >
            {STATUS_LABEL[e.status]}
          </span>
        </span>
      </div>
      {e.status === "submitted" ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            aria-label="Nota para el joven"
            placeholder="Nota (opcional)"
            className={`${input} min-w-0 flex-1`}
            maxLength={1000}
            value={note}
            onChange={(ev) => setNote(ev.target.value)}
          />
          <Button
            variant="ink"
            size="sm"
            className="h-9 px-3 text-xs"
            loading={review.isPending}
            onClick={() => review.mutate(true)}
          >
            Aprobar
          </Button>
          <button
            type="button"
            onClick={() => review.mutate(false)}
            className="flex h-9 items-center rounded-full border-[1.5px] border-ink/20 px-3 text-xs font-semibold"
          >
            Pedir cambios
          </button>
        </div>
      ) : e.leader_note ? (
        <span className="text-xs text-ink/60">“{e.leader_note}”</span>
      ) : null}
    </div>
  );
}

function CampaignTotals({ id, goal, currency }: { id: string; goal: number; currency: string }) {
  const totals = useQuery({ queryKey: ["missions", "totals", id], queryFn: () => missionsRepository.totals(id) });
  const raised = totals.data?.confirmed ?? 0;
  return (
    <span className="text-xs text-ink/60">
      {money(raised, currency)} de {money(goal, currency)} · {progressPercent(raised, goal)}%
      {totals.data?.recorded ? ` · ${money(totals.data.recorded, currency)} por confirmar` : ""}
    </span>
  );
}

/** Ministerios: Bellas Artes approvals, mission goals and (pastor/admin) offering confirmation. */
export function LeaderMinistries() {
  const { churchId, isPending } = useLeaderChurch();
  const access = useAccess();
  const isTreasurer = access.data ? hasAnyRole(access.data, ["PASTOR", "CHURCH_ADMIN"], churchId) : false;
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["leader"] });
    void queryClient.invalidateQueries({ queryKey: ["missions"] });
  };
  const entries = useQuery({
    queryKey: ["leader", "fine-arts", churchId],
    queryFn: () => fineArtsRepository.leaderList(churchId!),
    enabled: Boolean(churchId),
  });
  const campaigns = useQuery({
    queryKey: ["leader", "campaigns", churchId],
    queryFn: () => missionsRepository.all(churchId!),
    enabled: Boolean(churchId),
  });
  const treasury = useQuery({
    queryKey: ["leader", "treasury", churchId],
    queryFn: () => missionsRepository.treasury(churchId!),
    enabled: Boolean(churchId) && isTreasurer,
  });
  const create = useMutation({ mutationFn: missionsRepository.create, onSuccess: refresh });
  const setActive = useMutation({
    mutationFn: (v: { id: string; active: boolean }) => missionsRepository.setActive(v.id, v.active),
    onSuccess: refresh,
  });
  const confirm = useMutation({
    mutationFn: (v: { id: string; ok: boolean }) => missionsRepository.confirm(v.id, v.ok),
    onSuccess: refresh,
  });
  const [f, setF] = useState({
    program: "speed_the_light" as MissionProgram,
    title: "",
    goal: "",
    currency: "MXN",
    story: "",
    quote: "",
  });

  if (!isPending && !churchId) return <LeaderNoChurch />;

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 font-display-x text-[40px] leading-[.9] tracking-[-.02em]">Ministerios</h1>
        <p className="m-0 text-sm text-ink/60">
          Bellas Artes, metas misioneras y ofrendas. Los jóvenes nunca ven montos individuales.
        </p>
      </div>

      <section className="flex flex-col gap-3 rounded-3xl bg-white p-[22px]" aria-labelledby="ba-title">
        <h2 id="ba-title" className="m-0 text-[17px] font-bold">
          Bellas Artes
        </h2>
        {entries.isPending ? <Skeleton className="h-16 rounded-2xl" /> : null}
        {entries.data && !entries.data.length ? (
          <span className="text-sm text-ink/60">Aún no hay presentaciones enviadas.</span>
        ) : null}
        {entries.data?.map((e) => (
          <EntryRow key={e.id} e={e} onDone={refresh} />
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-3xl bg-white p-[22px]" aria-labelledby="mis-title">
        <h2 id="mis-title" className="m-0 text-[17px] font-bold">
          Metas misioneras
        </h2>
        <form
          className="grid gap-2 md:grid-cols-[1.2fr_2fr_1fr_.7fr]"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(
              {
                church_id: churchId!,
                program: f.program,
                title: f.title.trim(),
                goal_amount: Number(f.goal),
                currency: f.currency.trim().toUpperCase(),
                story_title: f.story.trim() || null,
                story_quote: f.quote.trim() || null,
              },
              { onSuccess: () => setF((s) => ({ ...s, title: "", goal: "", story: "", quote: "" })) },
            );
          }}
        >
          <select
            aria-label="Programa"
            className={input}
            value={f.program}
            onChange={(e) => setF((s) => ({ ...s, program: e.target.value as MissionProgram }))}
          >
            <option value="speed_the_light">Speed the Light</option>
            <option value="ambassadors">Embajadores en Misión</option>
          </select>
          <input
            aria-label="Para qué"
            placeholder="Una camioneta en Guatemala"
            className={input}
            maxLength={120}
            value={f.title}
            onChange={(e) => setF((s) => ({ ...s, title: e.target.value }))}
          />
          <input
            aria-label="Meta"
            placeholder="Meta"
            type="number"
            min={1}
            className={input}
            value={f.goal}
            onChange={(e) => setF((s) => ({ ...s, goal: e.target.value }))}
          />
          <input
            aria-label="Moneda"
            placeholder="MXN"
            maxLength={3}
            className={input}
            value={f.currency}
            onChange={(e) => setF((s) => ({ ...s, currency: e.target.value }))}
          />
          <input
            aria-label="Historia (título)"
            placeholder="Familia Ortiz · Guatemala (opcional)"
            className={`${input} md:col-span-2`}
            maxLength={80}
            value={f.story}
            onChange={(e) => setF((s) => ({ ...s, story: e.target.value }))}
          />
          <input
            aria-label="Historia (frase)"
            placeholder="Frase del misionero (opcional)"
            className={`${input} md:col-span-2`}
            maxLength={200}
            value={f.quote}
            onChange={(e) => setF((s) => ({ ...s, quote: e.target.value }))}
          />
          {create.isError ? (
            <p role="alert" className="m-0 text-sm text-coral md:col-span-4">
              {create.error.message}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="ink"
            size="sm"
            className="h-11 md:col-span-4 md:justify-self-start"
            disabled={f.title.trim().length < 2 || !(Number(f.goal) > 0) || !/^[A-Za-z]{3}$/.test(f.currency)}
            loading={create.isPending}
          >
            Crear meta
          </Button>
        </form>
        {campaigns.data?.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/[.06] pb-3 last:border-0"
          >
            <span className="flex flex-col">
              <span className="text-sm font-semibold">
                {c.program === "speed_the_light" ? "Speed the Light" : "Embajadores"} · {c.title}
              </span>
              <CampaignTotals id={c.id} goal={c.goal_amount} currency={c.currency} />
            </span>
            <button
              type="button"
              onClick={() => setActive.mutate({ id: c.id, active: !c.is_active })}
              className={`flex h-9 items-center rounded-full px-3 text-xs font-semibold ${c.is_active ? "bg-stage-crece" : "border-[1.5px] border-ink/20"}`}
            >
              {c.is_active ? "Activa" : "Cerrada"}
            </button>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-3xl bg-white p-[22px]" aria-labelledby="tes-title">
        <h2 id="tes-title" className="m-0 text-[17px] font-bold">
          Ofrendas por confirmar
        </h2>
        {!isTreasurer ? (
          <span className="text-sm text-ink/60">
            Solo el pastor o el administrador de la iglesia ven los montos y confirman ofrendas.
          </span>
        ) : treasury.isPending ? (
          <Skeleton className="h-16 rounded-2xl" />
        ) : treasury.data?.length ? (
          treasury.data.map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/[.06] pb-3 last:border-0"
            >
              <span className="text-sm font-semibold">
                {shortName(o.person)} · {money(o.amount, o.currency)} · {o.campaign}
              </span>
              {o.status === "recorded" ? (
                <span className="flex gap-1.5">
                  <Button
                    variant="ink"
                    size="sm"
                    className="h-9 px-3 text-xs"
                    onClick={() => confirm.mutate({ id: o.id, ok: true })}
                  >
                    Recibida
                  </Button>
                  <button
                    type="button"
                    onClick={() => confirm.mutate({ id: o.id, ok: false })}
                    className="flex h-9 items-center rounded-full border-[1.5px] border-ink/20 px-3 text-xs font-semibold"
                  >
                    No recibida
                  </button>
                </span>
              ) : (
                <span className="text-xs font-semibold text-ink/55">
                  {o.status === "confirmed" ? "Recibida ✓" : "No recibida"}
                </span>
              )}
            </div>
          ))
        ) : (
          <span className="text-sm text-ink/60">No hay ofrendas registradas.</span>
        )}
        <p className="m-0 text-xs text-ink/55">Cada confirmación queda registrada en la auditoría.</p>
      </section>
    </>
  );
}
