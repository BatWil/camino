"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { SplashState } from "@/components/layout/splash-state";
import { StateView } from "@/components/feedback/state-view";
import { useCurrentChurch } from "@/features/churches/hooks/use-access";
import { fitTitleStyle } from "@/utils/fit-title";
import { chipColor, conferenceDates } from "../domain/conference";
import { useConference, useConferenceRegister } from "../hooks/use-conferences";

/** Screen 8b · Conferencia Nacional · detalle. */
export function ConferenceDetail() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const { church } = useCurrentChurch();
  const { conference, registration, churchCount } = useConference(id);
  const register = useConferenceRegister(id ?? "");

  if (conference.isPending && id) return <SplashState />;
  const c = conference.data;
  if (!c) {
    return (
      <main className="pt-safe flex min-h-dvh items-center bg-paper px-5">
        <StateView kind="empty" title="Conferencia no disponible" />
      </main>
    );
  }
  const registered = Boolean(registration.data);
  const n = churchCount.data ?? 0;

  return (
    <main className="min-h-dvh bg-paper">
      <div className="mx-auto max-w-[600px]">
        <div className="bg-ink pb-[26px] text-paper" style={{ paddingTop: "calc(var(--safe-top) + 8px)" }}>
          <div className="px-5">
            <button
              type="button"
              onClick={() => (window.history.length > 1 ? router.back() : router.replace("/ministerios"))}
              aria-label="Volver"
              className="flex size-10 items-center justify-center rounded-full bg-white/[.12]"
            >
              <ArrowLeft className="size-5" aria-hidden />
            </button>
          </div>
          <div className="photo-ink relative mx-3 mt-3.5 h-[190px] rounded-[26px]">
            {c.badge ? (
              <span className="absolute right-3.5 bottom-3.5 rotate-[4deg] rounded-xl bg-coral px-3.5 py-2 font-display-x text-sm text-ink">
                {c.badge}
              </span>
            ) : null}
          </div>
          <div className="@container flex flex-col gap-2.5 px-6 pt-5">
            <h1
              className="m-0 font-display-x text-[34px] leading-[.88] tracking-[-.03em]"
              style={fitTitleStyle(c.title, 34)}
            >
              {c.title}
            </h1>
            {c.tagline ? <span className="text-[15px] text-paper/75">{c.tagline}</span> : null}
          </div>
        </div>

        <div className="flex flex-col gap-2.5 px-3 pt-3.5" style={{ paddingBottom: "calc(var(--safe-bottom) + 30px)" }}>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1 rounded-[20px] bg-white px-4 py-3.5">
              <span className="eyebrow text-ink/50">Fechas</span>
              <span className="text-[15px] font-bold">{conferenceDates(c.starts_on, c.ends_on)}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-[20px] bg-white px-4 py-3.5">
              <span className="eyebrow text-ink/50">Lugar</span>
              <span className="text-[15px] font-bold">{c.location ?? "Por confirmar"}</span>
            </div>
          </div>
          {c.highlights.length ? (
            <div className="flex flex-col gap-2.5 rounded-[22px] bg-white p-[18px]">
              <span className="eyebrow text-ink/50">Qué hay</span>
              <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {c.highlights.map((h, i) => {
                  const [bg, fg] = chipColor(i);
                  return (
                    <li
                      key={h}
                      className="rounded-full px-3 py-2 text-xs font-bold"
                      style={{ background: bg, color: fg }}
                    >
                      {h}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          {church ? (
            <div className="flex items-center justify-between rounded-[22px] bg-lime p-[18px]">
              <span className="flex flex-col gap-1">
                <span className="eyebrow">{n > 0 ? "Tu iglesia va" : "Tu iglesia"}</span>
                <span className="text-[15px] font-bold">
                  {church.churchName} ·{" "}
                  {n === 0
                    ? "sé el primero en inscribirte"
                    : `${n} ${n === 1 ? "joven inscrito" : "jóvenes inscritos"}`}
                </span>
              </span>
              <span className="font-hand text-2xl">¡vamos!</span>
            </div>
          ) : null}
          {register.isError ? (
            <p role="alert" className="m-0 text-center text-sm font-semibold text-coral">
              {register.error.message}
            </p>
          ) : null}
          {registered ? (
            <Link
              href={`/conferencia/agenda/?id=${c.id}`}
              className="flex h-[58px] items-center justify-center rounded-full bg-stage-crece text-base font-bold"
            >
              Estás registrado ✓ · Mi gafete
            </Link>
          ) : c.registration_url ? (
            <a
              href={c.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => register.mutate(true)}
              className="flex h-[58px] items-center justify-center rounded-full bg-ink text-base font-bold text-white"
            >
              Registrarme
            </a>
          ) : (
            <Button
              variant="ink"
              size="lg"
              block
              className="h-[58px]"
              loading={register.isPending}
              onClick={() => register.mutate(true)}
            >
              Registrarme
            </Button>
          )}
          <ButtonLink
            href={`/conferencia/agenda/?id=${c.id}`}
            variant="ghost"
            size="md"
            block
            className="h-[50px] border-[1.5px] border-ink/20 text-sm font-semibold"
          >
            Ver agenda
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
