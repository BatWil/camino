"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/feedback/state-view";
import { useCurrentChurch } from "@/features/churches/hooks/use-access";
import { useFeaturedConference } from "@/features/conferences/hooks/use-conferences";
import type { FineArtsCategory } from "@/lib/supabase/database.types";
import { cn } from "@/utils/cn";
import {
  categoryLabel,
  deadlineLabel,
  FINE_ARTS_CATEGORIES,
  FINE_ARTS_MIME,
  STATUS_LABEL,
  validateUpload,
} from "../domain/fine-arts";
import { useFineArtsActions, useMyEntries } from "../hooks/use-fine-arts";

function Step({ n, label, state }: { n: number; label: string; state: "done" | "current" | "next" }) {
  return (
    <li className={cn("flex items-center gap-3", state === "next" && "text-ink/50")}>
      <span
        className={cn(
          "flex size-7 flex-none items-center justify-center rounded-full text-[13px] font-bold",
          state === "done" && "bg-stage-crece",
          state === "current" && "bg-ink text-white",
          state === "next" && "border-2 border-ink/20",
        )}
      >
        {state === "done" ? <Check className="size-4" aria-hidden /> : n}
      </span>
      <span className="text-[15px] font-semibold">{label}</span>
    </li>
  );
}

/** Screen 8d · Bellas Artes · inscribir mi presentación. */
export function FineArtsScreen() {
  const router = useRouter();
  const { church, isPending: churchPending } = useCurrentChurch();
  const conf = useFeaturedConference();
  const entries = useMyEntries();
  const { create, upload, submit, update } = useFineArtsActions();
  const fileInput = useRef<HTMLInputElement>(null);
  const editable = entries.data?.find((e) => e.status === "draft" || e.status === "returned") ?? null;
  const others = (entries.data ?? []).filter((e) => e.id !== editable?.id);
  const [picked, setPicked] = useState<FineArtsCategory | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const category = picked ?? editable?.category ?? null;
  const hasFile = Boolean(editable?.file_path);
  const deadline = deadlineLabel(conf.data?.fine_arts_deadline ?? null);
  const error = [create.error, upload.error, submit.error, update.error].find(Boolean);

  const ensureEntry = async (cat: FineArtsCategory) => {
    if (editable) {
      if (editable.category !== cat) await update.mutateAsync({ id: editable.id, patch: { category: cat } });
      return editable.id;
    }
    return create.mutateAsync({
      churchId: church!.churchId,
      conferenceId: conf.data?.id ?? null,
      category: cat,
      title: null,
    });
  };

  const onFile = async (file: File | undefined) => {
    setFileError(null);
    if (!file || !category) return;
    const problem = validateUpload(file);
    if (problem) return setFileError(problem);
    const id = await ensureEntry(category);
    upload.mutate({ id, file });
  };

  return (
    <main className="min-h-dvh bg-stage-comparte text-white">
      <div className="mx-auto flex min-h-dvh max-w-[600px] flex-col">
        <div className="px-5 pb-2" style={{ paddingTop: "calc(var(--safe-top) + 8px)" }}>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="flex size-10 items-center justify-center rounded-full bg-white/20"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
        </div>
        <div className="flex flex-col gap-3 px-6 pt-5 pb-6">
          <h1 className="m-0 font-display-x text-[42px] leading-[.86] tracking-[-.03em]">Bellas Artes</h1>
          <p className="m-0 text-[15px] leading-[1.45]">Usa tu talento para adorar. Presenta tu obra en el festival.</p>
          {deadline ? <span className="origin-left -rotate-3 font-hand text-[26px] text-lime">{deadline}</span> : null}
        </div>

        <div
          className="flex flex-1 flex-col gap-2.5 rounded-t-[32px] bg-paper px-3 pt-[22px] text-ink"
          style={{ paddingBottom: "calc(var(--safe-bottom) + 30px)" }}
        >
          {churchPending || entries.isPending ? (
            <Skeleton className="h-40 rounded-[22px]" />
          ) : !church ? (
            <StateView
              kind="empty"
              title="Inscríbete con tu iglesia"
              message="Tu líder aprueba tu presentación, así que necesitas estar conectado a tu iglesia."
              action={
                <ButtonLink href="/unirse" variant="ink" size="sm">
                  Unirme a mi iglesia
                </ButtonLink>
              }
            />
          ) : sent ? (
            <div className="celebration-pop flex flex-col gap-2 rounded-[22px] bg-white p-[18px]">
              <span className="eyebrow text-violet">Enviada</span>
              <span className="text-lg font-bold">Tu líder revisará tu presentación.</span>
              <span className="text-sm text-ink/60">Te avisaremos aquí cuando la apruebe o te sugiera cambios.</span>
            </div>
          ) : (
            <>
              <h2 className="m-0 px-3 text-[17px] font-bold">Elige tu categoría</h2>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Categoría">
                {FINE_ARTS_CATEGORIES.map((c) => {
                  const on = category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setPicked(c.id)}
                      className={cn(
                        "flex h-[74px] items-end rounded-[18px] p-2.5 text-left text-[13px] font-bold",
                        on ? "bg-ink text-lime" : "bg-white",
                      )}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>

              <ol className="m-0 flex list-none flex-col gap-3 rounded-[22px] bg-white p-[18px]">
                <Step
                  n={1}
                  label={category ? "Categoría elegida" : "Elige tu categoría"}
                  state={category ? "done" : "current"}
                />
                <Step n={2} label="Sube tu video o archivo" state={hasFile ? "done" : category ? "current" : "next"} />
                <Step n={3} label="Aprobación de tu líder" state="next" />
              </ol>

              {editable?.status === "returned" && editable.leader_note ? (
                <p className="m-0 rounded-[18px] bg-stage-encuentra p-3.5 text-sm">
                  <strong>Tu líder sugiere:</strong> {editable.leader_note}
                </p>
              ) : null}

              <input
                ref={fileInput}
                type="file"
                className="sr-only"
                accept={FINE_ARTS_MIME.join(",")}
                aria-label="Archivo de tu presentación"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <button
                type="button"
                disabled={!category || upload.isPending}
                onClick={() => fileInput.current?.click()}
                className="flex h-[120px] flex-col items-center justify-center gap-1.5 rounded-[22px] border-2 border-dashed border-ink/25 disabled:opacity-50"
              >
                <span className="text-[22px]" aria-hidden>
                  {upload.isPending ? "…" : hasFile ? "✓" : "↑"}
                </span>
                <span className="text-sm font-semibold">
                  {upload.isPending ? "Subiendo…" : hasFile ? "Archivo listo · cambiar" : "Subir presentación"}
                </span>
                <span className="text-xs text-ink/50">Video, audio, imagen o PDF · máx. 50 MB</span>
              </button>
              {fileError || error ? (
                <p role="alert" className="m-0 text-sm font-semibold text-coral">
                  {fileError ?? error?.message}
                </p>
              ) : null}
              <Button
                variant="ink"
                size="lg"
                block
                className="h-[58px]"
                disabled={!editable || !hasFile}
                loading={submit.isPending}
                onClick={() => submit.mutate(editable!.id, { onSuccess: () => setSent(true) })}
              >
                Continuar
              </Button>
              <span className="text-center text-xs text-ink/55">
                Solo tú y los líderes de tu iglesia pueden ver tu archivo.
              </span>
            </>
          )}

          {others.length ? (
            <section aria-labelledby="mis-presentaciones" className="mt-3 flex flex-col gap-2">
              <h2 id="mis-presentaciones" className="m-0 px-3 text-[17px] font-bold">
                Mis presentaciones
              </h2>
              {others.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-[22px] bg-white px-[18px] py-4"
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[15px] font-bold">{categoryLabel(e.category)}</span>
                    {e.leader_note ? <span className="text-xs text-ink/60">“{e.leader_note}”</span> : null}
                  </span>
                  <span
                    className={cn(
                      "flex-none rounded-full px-3 py-1.5 text-xs font-bold",
                      e.status === "approved" ? "bg-stage-crece" : "bg-paper",
                    )}
                  >
                    {STATUS_LABEL[e.status]}
                  </span>
                </div>
              ))}
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
