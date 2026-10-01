"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { pushSupported, syncGentleReminders } from "@/lib/native/notifications";
import { isNative } from "@/lib/platform";
import { useNoticePrefs, usePushToggle } from "../hooks/use-notifications";

function Switch({
  on,
  label,
  disabled,
  onChange,
}: {
  on: boolean;
  label: string;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 flex-none rounded-full transition-colors disabled:opacity-50 ${on ? "bg-stage-crece" : "bg-ink/15"}`}
    >
      <span
        className={`absolute top-[3px] size-[22px] rounded-full bg-white transition-all ${on ? "left-[23px]" : "left-[3px]"}`}
      />
    </button>
  );
}

const row = "flex items-center justify-between gap-3 border-b border-ink/[.06] px-5 py-4 last:border-0";
const hhmm = (t: string) => t.slice(0, 5);

/** Avisos preferences: everything is opt-in; permission is asked only when a switch is turned on. */
export function NoticePreferences() {
  const router = useRouter();
  const { prefs, value, save } = useNoticePrefs();
  const push = usePushToggle();
  const native = isNative();
  const pushResult = push.data;

  const setReminder = async (on: boolean, time = value.reminder_time) => {
    const result = await syncGentleReminders({ enabled: on, time, askPermission: on });
    if (on && result === "denied") return;
    save.mutate({ daily_reminder: on, reminder_time: time });
  };

  return (
    <div className="flex flex-col gap-4 px-3 pb-8">
      <div className="contents">
        <div className="px-2 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="flex size-10 items-center justify-center rounded-full bg-white"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
        </div>
        <h1 className="m-0 px-3 font-display-x text-[34px] leading-[.9]">Tus avisos</h1>
        <p className="m-0 px-3 text-[15px] leading-[1.45] text-ink/65">
          Pocos, amables y solo si tú quieres. Nunca te escribiremos para presionarte.
        </p>
        {prefs.isPending ? (
          <Skeleton className="h-64 rounded-3xl" />
        ) : (
          <>
            <section className="overflow-hidden rounded-3xl bg-white" aria-label="Este teléfono">
              <div className={row}>
                <span className="flex flex-col">
                  <span className="text-[15px] font-semibold">Notificaciones en este teléfono</span>
                  <span className="text-xs text-ink/55">
                    {!native || !pushSupported()
                      ? "Disponible en la app de Android e iOS. Aquí verás tus avisos dentro de Camino."
                      : pushResult === "denied"
                        ? "Están bloqueadas en los ajustes del teléfono. Actívalas ahí para Camino."
                        : pushResult === "error"
                          ? "No pudimos activarlas. Inténtalo más tarde."
                          : "Mensajes de tu mentor, respuestas y eventos. El contenido privado no se muestra en la pantalla bloqueada."}
                  </span>
                </span>
                <Switch
                  label="Notificaciones en este teléfono"
                  on={value.push_enabled}
                  disabled={!native || !pushSupported() || push.isPending}
                  onChange={(v) => push.mutate(v)}
                />
              </div>
              <div className={row}>
                <span className="flex flex-col">
                  <span className="text-[15px] font-semibold">Eventos e invitaciones</span>
                  <span className="text-xs text-ink/55">Nuevos eventos de tu iglesia e invitaciones a planes.</span>
                </span>
                <Switch
                  label="Eventos e invitaciones"
                  on={value.community}
                  onChange={(v) => save.mutate({ community: v })}
                />
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl bg-white" aria-label="Recordatorios">
              <div className={row}>
                <span className="flex flex-col">
                  <span className="text-[15px] font-semibold">Recordatorio amable</span>
                  <span className="text-xs text-ink/55">
                    “Tu devocional te espera”, una vez al día. Si no entras en una semana, un solo “te extrañamos, sin
                    presión”.
                  </span>
                </span>
                <Switch
                  label="Recordatorio amable"
                  on={value.daily_reminder}
                  disabled={!native}
                  onChange={(v) => void setReminder(v)}
                />
              </div>
              <label className={row}>
                <span className="text-[15px] font-semibold">Hora del recordatorio</span>
                <input
                  type="time"
                  value={hhmm(value.reminder_time)}
                  disabled={!value.daily_reminder}
                  onChange={(e) => e.target.value && void setReminder(true, e.target.value)}
                  className="h-10 rounded-xl bg-paper px-3 text-[15px] disabled:opacity-50"
                />
              </label>
            </section>

            <section className="overflow-hidden rounded-3xl bg-white" aria-label="Horario de descanso">
              <div className="px-5 pt-4">
                <span className="text-[15px] font-semibold">Horario de descanso</span>
                <p className="m-0 mt-1 text-xs text-ink/55">
                  En este horario no enviamos notificaciones. Los avisos esperan dentro de la app.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 px-5 py-4">
                <label className="flex flex-col gap-1 text-xs font-semibold">
                  Desde
                  <input
                    type="time"
                    value={hhmm(value.quiet_start)}
                    onChange={(e) => e.target.value && save.mutate({ quiet_start: e.target.value })}
                    className="h-10 rounded-xl bg-paper px-3 text-[15px]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold">
                  Hasta
                  <input
                    type="time"
                    value={hhmm(value.quiet_end)}
                    onChange={(e) => e.target.value && save.mutate({ quiet_end: e.target.value })}
                    className="h-10 rounded-xl bg-paper px-3 text-[15px]"
                  />
                </label>
              </div>
            </section>
            {save.isError ? (
              <p role="alert" className="m-0 px-3 text-sm font-semibold text-coral">
                {save.error.message}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
