"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { SplashState } from "@/components/layout/splash-state";
import { StateView } from "@/components/feedback/state-view";
import { env } from "@/lib/env";
import { shareText } from "@/lib/native/share";
import { fitTitleStyle } from "@/utils/fit-title";
import { attendanceLabel, eventShareUrl, formatEventDates, formatEventTime } from "../domain/event-format";
import { useEvent, useMyRegistrations, useRegister } from "../hooks/use-events";

/** Screen 7d · Evento · detalle e inscripción. */
export function EventDetail() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const { event, attendance } = useEvent(id);
  const regs = useMyRegistrations();
  const register = useRegister();
  const [note, setNote] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  if (!id) {
    return (
      <main className="pt-safe flex min-h-dvh items-center bg-paper px-5">
        <StateView kind="empty" title="Evento no encontrado" />
      </main>
    );
  }
  if (event.isPending) return <SplashState />;
  const e = event.data;
  if (!e) {
    return (
      <main className="pt-safe flex min-h-dvh items-center bg-paper px-5">
        <StateView
          kind="unauthorized"
          title="Este evento no está disponible"
          message="Puede que sea de otra iglesia o que ya no esté publicado."
          action={
            <ButtonLink href="/comunidad" variant="ink" size="sm">
              Ir a Comunidad
            </ButtonLink>
          }
        />
      </main>
    );
  }

  const mine = regs.data?.find((r) => r.event_id === e.id && r.status !== "cancelled");
  const past = new Date(e.starts_at).getTime() < now;
  const closed = !e.registration_open || past;

  const invite = async () => {
    const r = await shareText({
      title: e.title,
      text: `¿Vienes conmigo a ${e.title}? ${formatEventDates(e.starts_at, e.ends_at)}`,
      url: eventShareUrl(env.appUrl, e.id),
    });
    if (r === "copied") setNote("Enlace copiado para compartir");
    if (r === "failed") setNote("No pudimos abrir el menú para compartir");
  };

  return (
    <main className="min-h-dvh bg-paper">
      <div className="mx-auto max-w-[600px]">
        <div
          className="flex h-[420px] flex-col justify-between pb-[22px]"
          style={{ background: "repeating-linear-gradient(135deg,#FFD0C4 0 12px,#FFC2B3 12px 24px)" }}
        >
          <div className="px-5" style={{ paddingTop: "calc(var(--safe-top) + 16px)" }}>
            <button
              type="button"
              onClick={() => (window.history.length > 1 ? router.back() : router.replace("/comunidad"))}
              aria-label="Volver"
              className="flex size-10 items-center justify-center rounded-full bg-white"
            >
              <ArrowLeft className="size-5" aria-hidden />
            </button>
          </div>
          <div className="@container flex flex-col gap-2 px-5">
            <span className="self-start rounded-full bg-ink px-3 py-1.5 font-mono text-[11px] font-semibold text-lime">
              {formatEventDates(e.starts_at, e.ends_at)}
            </span>
            <h1
              className="m-0 font-display-x text-[44px] leading-[.86] tracking-[-.03em]"
              style={fitTitleStyle(e.title, 44)}
            >
              {e.title}
            </h1>
          </div>
        </div>

        <div
          className="flex flex-col gap-2.5 px-3 pt-[18px]"
          style={{ paddingBottom: "calc(var(--safe-bottom) + 30px)" }}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1 rounded-[20px] bg-white px-4 py-3.5">
              <span className="eyebrow text-ink/50">Lugar</span>
              <span className="text-[15px] font-bold">{e.location_name ?? "Por confirmar"}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-[20px] bg-white px-4 py-3.5">
              <span className="eyebrow text-ink/50">Costo</span>
              <span className="text-[15px] font-bold">{e.cost_text ?? "Gratis"}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-[20px] bg-white p-4">
            <span className="flex" aria-hidden>
              {["#FF8A3D", "#3D8BFF", "#35D07F"].map((c, i) => (
                <span
                  key={c}
                  className="size-[30px] rounded-full border-2 border-white"
                  style={{ background: c, marginLeft: i ? -10 : 0 }}
                />
              ))}
            </span>
            <span className="text-sm font-semibold">
              {attendance.data === undefined ? "…" : attendanceLabel(attendance.data, Boolean(mine))}
            </span>
          </div>
          <p className="mx-2 my-1 text-[15px] leading-[1.5] text-ink/75 first-letter:uppercase">
            {formatEventTime(e.starts_at)}
            {e.description ? ` · ${e.description}` : ""}
          </p>

          {register.isError ? (
            <p role="alert" className="m-0 text-center text-sm font-semibold text-coral">
              {register.error.message}
            </p>
          ) : null}
          {mine ? (
            <>
              <div className="flex h-[58px] items-center justify-center rounded-full bg-stage-crece text-base font-bold">
                Estás inscrito ✓
              </div>
              {!past ? (
                <Button
                  variant="ghost"
                  size="md"
                  className="text-sm text-ink/60"
                  loading={register.isPending}
                  onClick={() => register.mutate({ eventId: e.id, register: false })}
                >
                  Ya no podré ir
                </Button>
              ) : null}
            </>
          ) : (
            <Button
              variant="ink"
              size="lg"
              block
              className="h-[58px]"
              disabled={closed}
              loading={register.isPending}
              onClick={() => register.mutate({ eventId: e.id, register: true })}
            >
              {closed ? "Inscripciones cerradas" : "Inscribirme"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="md"
            block
            className="h-[50px] border-[1.5px] border-ink/20 text-sm font-semibold"
            onClick={invite}
          >
            Invitar a un amigo
          </Button>
          <p aria-live="polite" className="m-0 min-h-5 text-center text-[13px] text-ink/60">
            {note ?? ""}
          </p>
        </div>
      </div>
    </main>
  );
}
