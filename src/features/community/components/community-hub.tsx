"use client";

import { cn } from "@/utils/cn";
import { tap } from "@/lib/native/haptics";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentChurch } from "@/features/churches/hooks/use-access";
import { fitTitleStyle } from "@/utils/fit-title";
import { formatEventDates } from "@/features/events/domain/event-format";
import { useMyRegistrations, useUpcomingEvents } from "@/features/events/hooks/use-events";
import { useMyMentees, useMyMentor } from "@/features/mentorship/hooks/use-mentorship";
import { useMyServiceRequests, useOpportunities } from "@/features/service/hooks/use-service";
import {
  useActiveSeries,
  useConversationRequest,
  useMyGroup,
  usePlanInvites,
  usePrayFor,
  useRoster,
  useSharedPrayers,
} from "../hooks/use-community";

const DOTS = ["#FF8A3D", "#3D8BFF", "#35D07F"];
const EVENT_STRIPES = [
  ["#FFD0C4", "#FFC2B3"],
  ["#E6E0FF", "#DCD4FF"],
  ["#D7F5E4", "#C6EFD8"],
];

function SeriesCard() {
  const series = useActiveSeries();
  if (series.isPending) return <Skeleton className="h-[74px] rounded-[26px]" />;
  const s = series.data;
  if (!s) return null;
  const body = (
    <>
      <span className="flex flex-col gap-1">
        <span className="eyebrow">
          Serie actual · Tema {s.current_topic} de {s.total_topics}
        </span>
        <span className="text-[17px] font-bold">{s.title}</span>
        {s.current_title ? <span className="text-[13px] text-ink/70">{s.current_title}</span> : null}
      </span>
      <span className="text-xl" aria-hidden>
        →
      </span>
    </>
  );
  const cls = "flex items-center justify-between rounded-[26px] bg-stage-encuentra px-5 py-[18px] text-left";
  return s.plan_id ? (
    <Link href={`/plan/?id=${s.plan_id}`} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function GroupCard() {
  const group = useMyGroup();
  const [open, setOpen] = useState(false);
  const roster = useRoster(open ? group.data?.id : null);
  if (group.isPending) return <Skeleton className="h-[170px] rounded-[26px]" />;
  const g = group.data;
  return (
    <>
      <button
        type="button"
        onClick={() => g && setOpen(true)}
        disabled={!g}
        className="flex flex-col gap-2.5 rounded-[26px] bg-white p-[18px] text-left disabled:cursor-default"
      >
        <span className="eyebrow text-ink/50">Mi grupo</span>
        <span className="text-base leading-[1.2] font-bold">{g ? g.name : "Aún no estás en un grupo"}</span>
        <span className="flex" aria-hidden>
          {DOTS.map((c, i) => (
            <span
              key={c}
              className="size-[26px] rounded-full border-2 border-white"
              style={{ background: g ? c : "#D9D5CB", marginLeft: i ? -8 : 0 }}
            />
          ))}
        </span>
        <span className="text-xs font-semibold text-violet">
          {g ? (g.meetingSchedule ?? "Ver quiénes están") : "Pregunta a tu líder"}
        </span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={g?.name ?? "Mi grupo"}>
        {roster.isPending ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {(roster.data ?? []).map((m) => (
              <li key={m.user_id} className="flex items-center gap-3 text-[15px] font-semibold">
                <Avatar size={34} />
                {m.first_name}
                {m.is_leader ? <span className="eyebrow text-violet">Líder</span> : null}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 mb-0 text-xs text-ink/55">Solo ves el nombre de pila de quienes comparten tu grupo.</p>
      </Sheet>
    </>
  );
}

function MentorCard() {
  const mentor = useMyMentor();
  const { open, request } = useConversationRequest();
  if (mentor.isPending) return <Skeleton className="h-[170px] rounded-[26px]" />;
  const m = mentor.data;
  if (m) {
    return (
      <Link
        href={`/mentoria/?id=${m.mentorship_id}`}
        className="flex flex-col gap-2.5 rounded-[26px] bg-stage-vive p-[18px] text-white"
      >
        <span className="eyebrow">Mi mentor</span>
        <span
          className="size-10 rounded-full"
          style={{ background: "repeating-linear-gradient(135deg,#8DB8FF 0 5px,#7AABFF 5px 10px)" }}
          aria-hidden
        />
        <span className="text-base font-bold">{m.mentor_name}</span>
        <span className="text-xs font-semibold">Hablar →</span>
      </Link>
    );
  }
  const sent = open.data || request.isSuccess;
  return (
    <button
      type="button"
      disabled={sent || request.isPending}
      onClick={() => request.mutate({ withRole: "mentor", topic: null })}
      className="flex flex-col gap-2.5 rounded-[26px] bg-stage-vive p-[18px] text-left text-white"
    >
      <span className="eyebrow">Mi mentor</span>
      <span
        className="size-10 rounded-full"
        style={{ background: "repeating-linear-gradient(135deg,#8DB8FF 0 5px,#7AABFF 5px 10px)" }}
        aria-hidden
      />
      <span className="text-base leading-[1.2] font-bold">
        {sent ? "Tu líder te asignará uno" : "Alguien que camine contigo"}
      </span>
      <span className="text-xs font-semibold">{sent ? "Solicitud enviada ✓" : "Pedir un mentor →"}</span>
    </button>
  );
}

function MenteesCard() {
  const mentees = useMyMentees();
  if (!mentees.data?.length) return null;
  return (
    <Link
      href="/mentoria"
      className="flex items-center justify-between rounded-[22px] bg-ink px-[18px] py-4 text-paper"
    >
      <span className="flex flex-col gap-1">
        <span className="eyebrow text-lime">Mentoría</span>
        <span className="text-[15px] font-bold">
          Acompañas a {mentees.data.length} {mentees.data.length === 1 ? "joven" : "jóvenes"}
        </span>
      </span>
      <span aria-hidden>→</span>
    </Link>
  );
}

function EventsRow() {
  const events = useUpcomingEvents(6);
  const regs = useMyRegistrations();
  const registered = new Set((regs.data ?? []).filter((r) => r.status !== "cancelled").map((r) => r.event_id));
  return (
    <section aria-labelledby="eventos-title">
      <div className="flex justify-between px-6 pt-[22px] pb-2.5">
        <h2 id="eventos-title" className="m-0 text-[17px] font-bold">
          Eventos
        </h2>
        <Link href="/eventos" className="text-[13px] font-semibold text-violet">
          Ver todos
        </Link>
      </div>
      {events.isPending ? (
        <div className="flex gap-2.5 px-3">
          <Skeleton className="h-[220px] w-[200px] rounded-[26px]" />
          <Skeleton className="h-[220px] w-[200px] rounded-[26px]" />
        </div>
      ) : events.data?.length ? (
        <ul className="m-0 flex list-none snap-x gap-2.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none]">
          {events.data.map((e, i) => {
            const [a, b] = EVENT_STRIPES[i % EVENT_STRIPES.length];
            const mine = registered.has(e.id);
            return (
              <li key={e.id} className="flex-none snap-start">
                <Link
                  href={`/evento/?id=${e.id}`}
                  className="flex h-[220px] w-[200px] flex-col justify-end gap-2 rounded-[26px] p-4"
                  style={{ background: `repeating-linear-gradient(135deg,${a} 0 10px,${b} 10px 20px)` }}
                >
                  <span className="@container">
                    <span className="block font-display-x text-lg leading-[.95]" style={fitTitleStyle(e.title, 18)}>
                      {e.title}
                    </span>
                  </span>
                  <span className="text-[13px] font-bold">{formatEventDates(e.starts_at, e.ends_at)}</span>
                  <span
                    className={`flex h-9 items-center self-start rounded-full px-3.5 text-xs font-semibold ${
                      mine ? "bg-stage-crece text-ink" : "bg-ink text-white"
                    }`}
                  >
                    {mine ? "Inscrito ✓" : e.capacity ? "Inscribirme" : "Participar"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mx-3 my-0 rounded-[22px] bg-white px-[18px] py-4 text-sm text-ink/60">
          Tu iglesia aún no ha publicado eventos.
        </p>
      )}
    </section>
  );
}

function PrayerAndService() {
  const prayers = useSharedPrayers();
  const pray = usePrayFor();
  const opportunities = useOpportunities();
  const requests = useMyServiceRequests();
  const requested = new Set((requests.data ?? []).map((r) => r.opportunity_id));
  const featured = (opportunities.data ?? []).find((o) => !requested.has(o.id)) ?? null;

  return (
    <section aria-labelledby="peticiones-title">
      <h2 id="peticiones-title" className="m-0 px-6 pt-[22px] pb-2.5 text-[17px] font-bold">
        Peticiones del grupo
      </h2>
      <div className="stagger flex flex-col gap-2.5 px-3">
        {prayers.isPending ? <Skeleton className="h-[72px] rounded-[22px]" /> : null}
        {prayers.data?.slice(0, 5).map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 rounded-[22px] bg-white px-[18px] py-4">
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-[15px] font-semibold">
                {p.title} · {p.owner_name}
              </span>
              <span className="text-xs text-ink/55">
                {p.group_name ? `Compartida con ${p.group_name}` : "Compartida con la iglesia"}
              </span>
            </span>
            <button
              type="button"
              disabled={p.prayed_today || pray.isPending}
              aria-pressed={p.prayed_today}
              onClick={() => {
                tap();
                pray.mutate(p.id);
              }}
              className={cn(
                "flex h-10 flex-none items-center rounded-full bg-lilac px-3.5 text-[13px] font-bold text-violet",
                p.prayed_today && "animate-pop",
              )}
            >
              {p.prayed_today ? "Orando ✓" : "Orar"}
            </button>
          </div>
        ))}
        {prayers.data && !prayers.data.length ? (
          <p className="m-0 rounded-[22px] bg-white px-[18px] py-4 text-sm text-ink/60">
            Cuando alguien de tu grupo comparta una petición, aparecerá aquí para que ores.
          </p>
        ) : null}
        <Link
          href="/servir"
          className="flex items-center justify-between gap-3 rounded-[22px] bg-stage-sirve px-[18px] py-4"
        >
          <span className="flex flex-col gap-1">
            <span className="eyebrow">Servir</span>
            <span className="text-[15px] font-bold">
              {featured
                ? featured.spots
                  ? `${featured.title} busca ${featured.spots} ${featured.spots === 1 ? "voluntario" : "voluntarios"}`
                  : featured.title
                : "Descubre dónde servir"}
            </span>
          </span>
          <span className="flex h-10 flex-none items-center rounded-full bg-ink px-3.5 text-[13px] font-semibold text-white">
            {featured ? "Me interesa" : "Ver"}
          </span>
        </Link>
      </div>
    </section>
  );
}

function PlanInvites() {
  const { invites, respond } = usePlanInvites();
  if (!invites.data?.length) return null;
  return (
    <>
      {invites.data.map((i) => (
        <div key={i.id} className="flex flex-col gap-2.5 rounded-[22px] bg-lilac px-[18px] py-4">
          <span className="eyebrow text-violet">Hacerlo juntos</span>
          <span className="text-[15px] font-bold">
            {i.from_name} te invitó a hacer “{i.plan_title}”
          </span>
          <span className="flex gap-1.5">
            <button
              type="button"
              disabled={respond.isPending}
              onClick={() => respond.mutate({ id: i.id, accept: true })}
              className="flex h-9 items-center rounded-full bg-ink px-3.5 text-xs font-semibold text-white"
            >
              Aceptar
            </button>
            <button
              type="button"
              disabled={respond.isPending}
              onClick={() => respond.mutate({ id: i.id, accept: false })}
              className="flex h-9 items-center rounded-full border-[1.5px] border-ink/25 px-3.5 text-xs font-semibold"
            >
              Ahora no
            </button>
          </span>
        </div>
      ))}
    </>
  );
}

/** Ministries are platform-wide: reachable with or without a church. */
function MinistriesLink() {
  return (
    <div className="px-3 pt-2.5">
      <Link
        href="/ministerios"
        className="flex items-center justify-between rounded-[22px] bg-ink px-[18px] py-4 text-paper"
      >
        <span className="flex flex-col gap-1">
          <span className="eyebrow text-lime">Ganar / Edificar / Enviar / Liderar</span>
          <span className="text-[15px] font-bold">Ministerios y conferencias</span>
        </span>
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}

/** Screen 2h · Comunidad: centred on the local church — no likes, no followers, no rankings. */
export function CommunityHub() {
  const { church } = useCurrentChurch();
  if (!church) return <MinistriesLink />;
  return (
    <div className="flex flex-col">
      <div className="stagger flex flex-col gap-2.5 px-3 pt-3">
        <PlanInvites />
        <SeriesCard />
        <div className="grid grid-cols-2 gap-2.5">
          <GroupCard />
          <MentorCard />
        </div>
        <MenteesCard />
      </div>
      <EventsRow />
      <PrayerAndService />
      <MinistriesLink />
    </div>
  );
}
