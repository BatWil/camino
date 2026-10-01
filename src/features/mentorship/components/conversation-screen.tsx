"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUp, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { SplashState } from "@/components/layout/splash-state";
import { StateView } from "@/components/feedback/state-view";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { moodMeta } from "@/features/checkin/domain/moods";
import { useCheckins } from "@/features/checkin/hooks/use-checkin";
import { localIsoDate, weekStart } from "@/features/rhythm/domain/rhythm";
import type { Message, SharedCheckin } from "../data/mentorship.repository";
import { cleanMessage, groupByDay, meetingLabel } from "../domain/conversation";
import {
  useConversation,
  useConversationActions,
  useMyMentees,
  useMyMentor,
  useShareCheckin,
} from "../hooks/use-mentorship";

function CheckinBubble({ checkin, mine }: { checkin: SharedCheckin | undefined; mine: boolean }) {
  const thisWeek = localIsoDate(weekStart(new Date()));
  const label = checkin
    ? `${checkin.week_start === thisWeek ? "Esta semana" : "Semana del " + checkin.week_start.slice(8, 10) + "/" + checkin.week_start.slice(5, 7)}: ${moodMeta(checkin.mood).label}`
    : "Ya no está compartido";
  return (
    <div
      className={`flex max-w-[82%] flex-col gap-1 rounded-[20px] bg-stage-crece p-3.5 ${
        mine ? "self-end rounded-br-[6px]" : "self-start rounded-bl-[6px]"
      }`}
    >
      <span className="eyebrow">Check-in compartido</span>
      <span className="text-[15px] font-bold">{label}</span>
    </div>
  );
}

function MeetingBubble({
  message,
  mine,
  onRespond,
  busy,
}: {
  message: Message;
  mine: boolean;
  onRespond: (accept: boolean) => void;
  busy: boolean;
}) {
  return (
    <div
      className={`flex w-[230px] flex-col gap-2 rounded-[20px] bg-stage-encuentra p-3.5 ${mine ? "self-end" : "self-start"}`}
    >
      <span className="eyebrow">Propuesta de reunión</span>
      <span className="text-base font-bold">{meetingLabel(message.meeting_at!, message.meeting_place)}</span>
      {message.meeting_status === "proposed" && !mine ? (
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => onRespond(true)}
            className="flex h-9 items-center rounded-full bg-ink px-3.5 text-xs font-semibold text-white"
          >
            Confirmar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onRespond(false)}
            className="flex h-9 items-center rounded-full border-[1.5px] border-ink px-3.5 text-xs font-semibold"
          >
            Otra hora
          </button>
        </div>
      ) : (
        <span className="text-xs font-semibold">
          {message.meeting_status === "confirmed"
            ? "Confirmada ✓"
            : message.meeting_status === "declined"
              ? "Buscando otra hora"
              : "Esperando respuesta"}
        </span>
      )}
    </div>
  );
}

function Composer({
  mentorshipId,
  isMentee,
  onDecline,
}: {
  mentorshipId: string;
  isMentee: boolean;
  onDecline: string | null;
}) {
  const actions = useConversationActions(mentorshipId);
  const share = useShareCheckin();
  const { current } = useCheckins();
  const [text, setText] = useState(onDecline ?? "");
  const [more, setMore] = useState(false);
  const [when, setWhen] = useState("");
  const [place, setPlace] = useState("");
  const [lastPrefill, setLastPrefill] = useState(onDecline);
  if (onDecline !== lastPrefill) {
    setLastPrefill(onDecline);
    if (onDecline) setText(onDecline);
  }

  const send = () => {
    const body = cleanMessage(text);
    if (!body) return;
    actions.send.mutate(body, { onSuccess: () => setText("") });
  };

  return (
    <>
      <form
        className="flex items-center gap-2 px-3 pt-2.5"
        style={{ paddingBottom: "calc(var(--safe-bottom) + 16px)" }}
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <button
          type="button"
          onClick={() => setMore(true)}
          aria-label="Más opciones"
          className="flex size-[50px] flex-none items-center justify-center rounded-full bg-white"
        >
          <Plus className="size-5" aria-hidden />
        </button>
        <label htmlFor="msg" className="sr-only">
          Mensaje
        </label>
        <input
          id="msg"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          placeholder="Escribe un mensaje…"
          autoComplete="off"
          className="h-[50px] min-w-0 flex-1 rounded-full bg-white px-[18px] text-[15px] placeholder:text-ink/45 focus:outline-2 focus:outline-ink"
        />
        <button
          type="submit"
          aria-label="Enviar"
          disabled={!cleanMessage(text) || actions.send.isPending}
          className="flex size-[50px] flex-none items-center justify-center rounded-full bg-ink text-lime disabled:text-lime/50"
        >
          <ArrowUp className="size-5" aria-hidden />
        </button>
      </form>
      {actions.send.isError ? (
        <p role="alert" className="m-0 px-5 pb-2 text-sm font-semibold text-coral">
          {actions.send.error.message}
        </p>
      ) : null}

      <Sheet open={more} onClose={() => setMore(false)} title="Compartir">
        <div className="flex flex-col gap-3">
          <fieldset className="m-0 flex flex-col gap-2 rounded-[20px] bg-paper p-3.5">
            <legend className="eyebrow pb-1">Proponer reunión</legend>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Cuándo
              <input
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="h-11 rounded-xl bg-white px-3 text-[15px]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Dónde (un lugar público)
              <input
                value={place}
                maxLength={120}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Café, la iglesia…"
                className="h-11 rounded-xl bg-white px-3 text-[15px]"
              />
            </label>
            <Button
              variant="ink"
              size="md"
              disabled={!when}
              loading={actions.propose.isPending}
              onClick={() =>
                actions.propose.mutate(
                  { at: new Date(when).toISOString(), place: place.trim() || null },
                  { onSuccess: () => setMore(false) },
                )
              }
            >
              Proponer
            </Button>
          </fieldset>
          {isMentee ? (
            <div className="flex flex-col gap-2 rounded-[20px] bg-paper p-3.5">
              <span className="eyebrow">Check-in de esta semana</span>
              {current ? (
                current.shared_with_mentor ? (
                  <span className="text-sm">Ya lo compartiste ✓</span>
                ) : (
                  <Button
                    variant="ink"
                    size="md"
                    loading={share.isPending}
                    onClick={() => share.mutate(current.id, { onSuccess: () => setMore(false) })}
                  >
                    Compartir “{moodMeta(current.mood).label}”
                  </Button>
                )
              ) : (
                <span className="text-sm text-ink/60">Aún no haces tu check-in de esta semana.</span>
              )}
              <span className="text-xs text-ink/55">Solo se comparte cómo te sientes, nunca tu nota.</span>
            </div>
          ) : null}
        </div>
      </Sheet>
    </>
  );
}

function SafetySheet({
  open,
  onClose,
  mentorshipId,
  churchId,
  isMentee,
  active,
}: {
  open: boolean;
  onClose: () => void;
  mentorshipId: string;
  churchId: string;
  isMentee: boolean;
  active: boolean;
}) {
  const actions = useConversationActions(mentorshipId);
  const [reason, setReason] = useState("");
  const [confirmEnd, setConfirmEnd] = useState(false);
  return (
    <Sheet open={open} onClose={onClose} title="Tu seguridad">
      <div className="flex flex-col gap-3 text-sm">
        <p className="m-0 leading-[1.5] text-ink/70">
          Esta conversación existe porque tu iglesia la asignó. Por cuidado de todos, el pastor de tu iglesia puede
          revisarla si hace falta. Nunca compartas contraseñas, tu dirección exacta ni fotos privadas.
        </p>
        {actions.report.isSuccess ? (
          <p className="m-0 rounded-2xl bg-stage-crece p-3 font-semibold">
            Gracias. Tu reporte llegó al pastor de tu iglesia. No le avisamos a la otra persona.
          </p>
        ) : (
          <div className="flex flex-col gap-2 rounded-[20px] bg-paper p-3.5">
            <label htmlFor="report" className="font-semibold">
              Reportar algo que te incomodó
            </label>
            <textarea
              id="report"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={1000}
              rows={3}
              className="rounded-xl bg-white p-3 text-[15px]"
            />
            <Button
              variant="ink"
              size="md"
              disabled={reason.trim().length < 3}
              loading={actions.report.isPending}
              onClick={() => actions.report.mutate({ churchId, mentorshipId, reason: reason.trim() })}
            >
              Enviar reporte
            </Button>
          </div>
        )}
        {active ? (
          confirmEnd ? (
            <div className="flex flex-col gap-2 rounded-[20px] bg-coral/15 p-3.5">
              <span className="font-semibold">
                {isMentee
                  ? "Dejarás de recibir mensajes de esta persona y no podrá ver nada de lo que compartiste."
                  : "La conversación se cerrará para los dos."}
              </span>
              <Button
                variant="ink"
                size="md"
                loading={actions.end.isPending}
                onClick={() =>
                  actions.end.mutate(isMentee ? "blocked_by_mentee" : "ended_by_mentor", { onSuccess: onClose })
                }
              >
                {isMentee ? "Bloquear y terminar" : "Terminar mentoría"}
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="md" className="text-coral" onClick={() => setConfirmEnd(true)}>
              {isMentee ? "Bloquear / terminar mentoría" : "Terminar mentoría"}
            </Button>
          )
        ) : null}
      </div>
    </Sheet>
  );
}

/** Screen 7b · Mentoría · conversación. */
export function ConversationScreen({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { conversation, messages, checkins } = useConversation(id);
  const mentor = useMyMentor();
  const mentees = useMyMentees();
  const actions = useConversationActions(id);
  const [safety, setSafety] = useState(false);
  const [prefill, setPrefill] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const count = messages.data?.length ?? 0;

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [count]);

  if (conversation.isPending || messages.isPending) return <SplashState />;
  const c = conversation.data;
  if (!c || !user) {
    return (
      <main className="pt-safe flex min-h-dvh items-center bg-paper px-5">
        <StateView kind="unauthorized" title="Conversación no disponible" />
      </main>
    );
  }
  const isMentee = c.menteeId === user.id;
  const mentee = mentees.data?.find((m) => m.mentorship_id === id);
  const name = isMentee
    ? mentor.data?.mentorship_id === id
      ? mentor.data.mentor_name
      : "Tu mentor"
    : (mentee?.first_name ?? "Joven");
  const subtitle = isMentee
    ? "Tu mentor · responde en horario de 9–21 h"
    : mentee
      ? [mentee.stage_name, mentee.current_plan].filter(Boolean).join(" · ") || "Tu joven"
      : "Tu joven";
  const byId = new Map((checkins.data ?? []).map((ch) => [ch.id, ch]));
  const active = c.status === "active";

  return (
    <main className="flex h-dvh flex-col bg-paper">
      <header
        className="flex items-center gap-3 bg-stage-vive px-5 pb-5 text-white"
        style={{ paddingTop: "calc(var(--safe-top) + 8px)" }}
      >
        <button type="button" onClick={() => router.back()} aria-label="Volver" className="-ml-1 p-1">
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <span
          className="size-11 flex-none rounded-full"
          style={{ background: "repeating-linear-gradient(135deg,#8DB8FF 0 5px,#7AABFF 5px 10px)" }}
          aria-hidden
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-base font-bold">{name}</span>
          <span className="text-xs leading-snug">{subtitle}</span>
        </div>
        <button type="button" onClick={() => setSafety(true)} aria-label="Seguridad y reporte" className="p-1">
          <MoreHorizontal className="size-6" aria-hidden />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[600px] flex-col gap-2.5 px-3.5 py-[18px]">
          {count === 0 ? (
            <p className="m-0 self-center rounded-2xl bg-white px-4 py-3 text-center text-sm text-ink/60">
              {isMentee
                ? "Saluda a tu mentor. Puedes contarle lo que quieras compartir."
                : "Escribe el primer mensaje."}
            </p>
          ) : null}
          {groupByDay(messages.data ?? []).map((group) => (
            <div key={group.label + group.items[0].id} className="flex flex-col gap-2.5">
              <span className="eyebrow self-center text-ink/45">{group.label}</span>
              {group.items.map((m) => {
                const mine = m.sender_id === user.id;
                if (m.kind === "checkin") {
                  return <CheckinBubble key={m.id} checkin={byId.get(m.check_in_id!)} mine={mine} />;
                }
                if (m.kind === "meeting") {
                  return (
                    <MeetingBubble
                      key={m.id}
                      message={m}
                      mine={mine}
                      busy={actions.respond.isPending}
                      onRespond={(accept) =>
                        actions.respond.mutate(
                          { messageId: m.id, accept },
                          { onSuccess: () => !accept && setPrefill("¿Podemos otro día u hora? ") },
                        )
                      }
                    />
                  );
                }
                return (
                  <p
                    key={m.id}
                    className={`m-0 max-w-[78%] rounded-[20px] px-3.5 py-3 text-[15px] leading-[1.4] whitespace-pre-line ${
                      mine ? "self-end rounded-br-[6px] bg-ink text-white" : "self-start rounded-bl-[6px] bg-white"
                    }`}
                  >
                    {m.body}
                  </p>
                );
              })}
            </div>
          ))}
          <div ref={end} />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[600px]">
        {active ? (
          <Composer mentorshipId={id} isMentee={isMentee} onDecline={prefill} />
        ) : (
          <p
            className="m-0 px-5 pt-3 text-center text-sm text-ink/60"
            style={{ paddingBottom: "calc(var(--safe-bottom) + 20px)" }}
          >
            Esta mentoría terminó. Si necesitas hablar con alguien, tu líder puede ayudarte.
          </p>
        )}
      </div>

      <SafetySheet
        open={safety}
        onClose={() => setSafety(false)}
        mentorshipId={id}
        churchId={c.churchId}
        isMentee={isMentee}
        active={active}
      />
    </main>
  );
}
