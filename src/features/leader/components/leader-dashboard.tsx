"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/feedback/state-view";
import { PrivacyDesignCard } from "@/features/panel/components/privacy-design-card";
import { useQuestionInbox } from "@/features/questions/hooks/use-questions";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { firstName } from "@/features/profile/domain/profile";
import { activePercent } from "../domain/leader";
import { useLeaderChurch, useLeaderOverview, useLeaderRequests, useLeaderYouth } from "../hooks/use-leader";
import { shortName } from "../domain/leader";
import { YouthTable } from "./youth-table";

function weekLabel(now = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `Semana del ${d.getDate()} ${months[d.getMonth()]}`;
}

function Tile({ label, value, className }: { label: string; value: number | undefined; className: string }) {
  return (
    <div className={`flex min-h-[120px] flex-col justify-between rounded-3xl p-5 ${className}`}>
      <span className="eyebrow">{label}</span>
      <span className="font-display-x text-[40px] leading-none">{value ?? "–"}</span>
    </div>
  );
}

export function LeaderNoChurch() {
  return (
    <StateView
      kind="unauthorized"
      title="Aún no lideras una iglesia"
      message="El panel de líder muestra los datos de la iglesia donde tienes un rol de líder, pastor o administrador."
    />
  );
}

/** Screen 3a · Dashboard del líder con privacidad explícita. */
export function LeaderDashboard() {
  const { churchId, churchName, isPending } = useLeaderChurch();
  const profile = useProfile();
  const overview = useLeaderOverview();
  const youth = useLeaderYouth();
  const { requests } = useLeaderRequests();
  const { inbox } = useQuestionInbox(churchId);
  const o = overview.data;
  const pct = o ? activePercent(o) : 0;
  const name = firstName(profile.data);

  if (!isPending && !churchId) return <LeaderNoChurch />;

  const newQuestions = (inbox.data ?? []).filter((q) => q.status === "new").slice(0, 3);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-ink/55">
            {weekLabel()}
            {churchName ? ` · ${churchName}` : ""}
          </span>
          <h1 className="m-0 font-display-x text-[40px] leading-[.9] tracking-[-.02em]">
            Hola{name ? `, ${name}` : ""}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/leader/jovenes"
            className="flex h-11 items-center rounded-full border-[1.5px] border-ink/20 px-[18px] text-sm font-semibold"
          >
            Asignar mentor
          </Link>
          <ButtonLink href="/leader/eventos" variant="ink" size="sm" className="h-11 px-[18px] text-sm">
            + Nuevo evento
          </ButtonLink>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
        <div className="col-span-2 flex flex-col gap-2.5 rounded-3xl bg-ink p-5 text-paper lg:col-span-1">
          <span className="eyebrow text-paper/55">Jóvenes</span>
          <span className="font-display-x text-[46px] leading-[.9]">{o?.youth ?? "–"}</span>
          <div
            className="h-2 rounded"
            style={{ background: `linear-gradient(90deg,#C6F432 ${pct}%,rgba(255,255,255,.15) ${pct}%)` }}
            aria-hidden
          />
          <span className="text-[13px] font-semibold text-lime">{pct}% activos esta semana</span>
        </div>
        <Tile label="En planes" value={o?.inPlans} className="bg-white [&>span:first-child]:text-ink/50" />
        <Tile label="Quieren servir" value={o?.wantServe} className="bg-stage-sirve" />
        <Tile label="Piden conversación" value={o?.conversations} className="bg-coral" />
        <Tile label="Preguntas nuevas" value={o?.newQuestions} className="bg-white [&>span:first-child]:text-ink/50" />
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.7fr_1fr]">
        <section className="flex flex-col gap-1 rounded-3xl bg-white p-[22px]" aria-labelledby="jovenes-title">
          <div className="flex items-center justify-between pb-2.5">
            <h2 id="jovenes-title" className="m-0 text-[17px] font-bold">
              Jóvenes
            </h2>
            <span className="text-[13px] text-ink/55">Solo datos de acompañamiento</span>
          </div>
          {youth.isPending ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : youth.data?.length ? (
            <>
              <YouthTable rows={youth.data.slice(0, 8)} />
              {youth.data.length > 8 ? (
                <Link href="/leader/jovenes" className="pt-2 text-[13px] font-semibold text-violet">
                  Ver los {youth.data.length} →
                </Link>
              ) : null}
            </>
          ) : (
            <p className="m-0 text-sm text-ink/60">
              Cuando los jóvenes se unan con el código de tu iglesia, aparecerán aquí.
            </p>
          )}
        </section>

        <div className="flex flex-col gap-3.5">
          <PrivacyDesignCard />
          <section className="flex flex-1 flex-col gap-3 rounded-3xl bg-white p-[22px]" aria-labelledby="piden-title">
            <h2 id="piden-title" className="m-0 text-base font-bold">
              Piden conversación
            </h2>
            {(requests.data ?? []).slice(0, 4).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">
                  {shortName(r.person)} ·{" "}
                  {r.with_role === "mentor"
                    ? "con un mentor"
                    : r.with_role === "pastor"
                      ? "con el pastor"
                      : "con un líder"}
                </span>
                <ButtonLink href="/leader/jovenes" variant="ink" size="sm" className="h-9 px-3.5 text-xs">
                  Responder
                </ButtonLink>
              </div>
            ))}
            {newQuestions.map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">
                  {q.is_anonymous ? "Anónimo" : shortName(q.author_name)} · pregunta
                </span>
                <Link
                  href="/leader/preguntas"
                  className="flex h-9 items-center rounded-full border-[1.5px] border-ink/20 px-3.5 text-xs font-semibold"
                >
                  Ver
                </Link>
              </div>
            ))}
            {!requests.data?.length && !newQuestions.length ? (
              <span className="text-sm text-ink/60">Nada pendiente por ahora.</span>
            ) : null}
            <span className="text-xs leading-[1.4] text-ink/55">
              El joven decide qué compartir. Solo ves lo que te envía.
            </span>
          </section>
        </div>
      </div>
    </>
  );
}
