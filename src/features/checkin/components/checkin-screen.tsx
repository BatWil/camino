"use client";

import { success, tap } from "@/lib/native/haptics";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SplashState } from "@/components/layout/splash-state";
import type { Mood } from "@/lib/supabase/database.types";
import type { CheckIn } from "../data/checkin.repository";
import { MOODS, moodMeta } from "../domain/moods";
import { useMyMentor, useShareCheckin } from "@/features/mentorship/hooks/use-mentorship";
import { useCheckins, useSaveCheckin } from "../hooks/use-checkin";

function Form({ current, thisWeek, history }: { current: CheckIn | null; thisWeek: string; history: CheckIn[] }) {
  const router = useRouter();
  const save = useSaveCheckin();
  const [mood, setMood] = useState<Mood | null>(current?.mood ?? null);
  const [note, setNote] = useState(current?.note ?? "");
  const [saved, setSaved] = useState(false);
  const mentor = useMyMentor();
  const shareCheckin = useShareCheckin();
  const alreadyShared = current?.shared_with_mentor ?? false;
  const [share, setShare] = useState(alreadyShared);
  const hasMentor = Boolean(mentor.data);
  const past = history.filter((c) => c.week_start !== thisWeek);

  return (
    <main className="pt-safe pb-safe min-h-dvh bg-paper text-ink">
      <div className="mx-auto flex min-h-dvh max-w-[600px] flex-col">
        <div className="flex items-center justify-between px-5 py-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Cerrar"
            className="flex size-10 items-center justify-center rounded-full bg-white"
          >
            <X className="size-[18px]" aria-hidden />
          </button>
          <span className="font-mono text-[11px] font-semibold tracking-[.1em]">CHECK-IN SEMANAL</span>
          <span className="w-10" />
        </div>
        <div className="flex flex-1 flex-col gap-3.5 px-6 pt-[22px] pb-6">
          <h1 className="m-0 font-display-x text-[32px] leading-[.95] tracking-[-.02em]">¿Cómo estás esta semana?</h1>
          <div className="mt-1.5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Cómo te sientes">
            {MOODS.map((m) => {
              const on = mood === m.mood;
              return (
                <button
                  key={m.mood}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    tap();
                    setMood(m.mood);
                  }}
                  className="flex h-[92px] flex-col justify-between rounded-[22px] border-[2.5px] p-3.5 text-left transition-all"
                  style={{ background: on ? m.color : "#FFFFFF", borderColor: on ? "#0D0A26" : "transparent" }}
                >
                  <span className="size-[18px] rounded-full" style={{ background: on ? "#0D0A26" : m.color }} />
                  <span className="text-base font-bold">{m.label}</span>
                </button>
              );
            })}
          </div>
          <label htmlFor="checkin-note" className="sr-only">
            ¿Quieres contar algo más?
          </label>
          <textarea
            id="checkin-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
            placeholder="¿Quieres contar algo más? (opcional)"
            className="min-h-[70px] rounded-[20px] bg-white p-4 text-[15px] placeholder:text-ink/45 focus:outline-2 focus:outline-ink"
          />
          <div className="flex items-center justify-between px-0.5 py-1">
            <span className="flex flex-col">
              <span className="text-sm font-semibold">Compartir con mi mentor</span>
              <span className="text-xs text-ink/55">
                {!hasMentor
                  ? "Disponible cuando tengas un mentor asignado."
                  : alreadyShared
                    ? `Ya lo compartiste con ${mentor.data!.mentor_name ?? "tu mentor"}.`
                    : "Solo verá cómo te sientes, nunca tu nota."}
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={share}
              disabled={!hasMentor || alreadyShared}
              aria-label="Compartir con mi mentor"
              onClick={() => setShare((v) => !v)}
              className={`relative h-7 w-12 flex-none rounded-full transition-colors ${share ? "bg-stage-crece" : "bg-ink/15"}`}
            >
              <span
                className={`absolute top-[3px] size-[22px] rounded-full bg-white transition-all ${share ? "left-[23px]" : "left-[3px]"}`}
              />
            </button>
          </div>
          <div className="min-h-4 flex-1" />
          <p
            aria-live="polite"
            className={`m-0 min-h-5 text-center text-sm font-semibold ${saved ? "animate-pop" : ""}`}
          >
            {saved
              ? "Guardado ✦ Gracias por contarlo."
              : save.isError || shareCheckin.isError
                ? "No pudimos guardar. Inténtalo de nuevo."
                : ""}
          </p>
          <Button
            variant="ink"
            size="lg"
            block
            className="h-[58px]"
            disabled={!mood}
            loading={save.isPending || shareCheckin.isPending}
            onClick={() =>
              save.mutate(
                { week_start: thisWeek, mood: mood!, note: note.trim() || null },
                {
                  onSuccess: (row) => {
                    if (share && hasMentor && !row.shared_with_mentor) {
                      shareCheckin.mutate(row.id, {
                        onSuccess: () => {
                          success();
                          setSaved(true);
                        },
                      });
                    } else {
                      success();
                      setSaved(true);
                    }
                  },
                },
              )
            }
          >
            Guardar
          </Button>
          <span className="text-center text-xs text-ink/55">
            {share ? "Lo verás tú y tu mentor." : "Por defecto, solo tú lo ves."}
          </span>

          {past.length ? (
            <section className="mt-4 flex flex-col gap-2" aria-labelledby="checkin-history">
              <h2 id="checkin-history" className="m-0 text-[15px] font-bold">
                Semanas anteriores
              </h2>
              <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {past.map((c) => {
                  const m = moodMeta(c.mood);
                  return (
                    <li
                      key={c.id}
                      className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold"
                    >
                      <span className="size-2.5 rounded-full" style={{ background: m.color }} aria-hidden />
                      {new Date(`${c.week_start}T12:00:00`).toLocaleDateString("es", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {m.label}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}

/** Screen 4c · Check-in · "toca cómo te sientes". */
export function CheckinScreen() {
  const { history, thisWeek, current } = useCheckins();
  if (history.isPending) return <SplashState />;
  return <Form current={current} thisWeek={thisWeek} history={history.data ?? []} />;
}
