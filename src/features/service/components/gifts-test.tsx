"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { AGREEMENT, GIFT_STATEMENTS, scoreGifts } from "../domain/gifts";
import { useServiceActions } from "../hooks/use-service";

/** Short gifts inventory. Results are private (owner-only RLS). */
export function GiftsTest() {
  const router = useRouter();
  const { saveGifts } = useServiceActions();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const statement = GIFT_STATEMENTS[index];
  const done = index >= GIFT_STATEMENTS.length;
  const progress = Math.round((Math.min(index, GIFT_STATEMENTS.length) / GIFT_STATEMENTS.length) * 100);

  const finish = () =>
    saveGifts.mutate({ answers, scores: scoreGifts(answers) }, { onSuccess: () => router.replace("/servir") });

  return (
    <main className="pt-safe pb-safe flex min-h-dvh flex-col bg-paper">
      <div className="mx-auto flex w-full max-w-[600px] flex-1 flex-col">
        <div className="flex items-center gap-3 px-5 py-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Cerrar"
            className="flex size-10 flex-none items-center justify-center rounded-full bg-white"
          >
            <X className="size-[18px]" aria-hidden />
          </button>
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Avance"
          >
            <div className="h-full rounded-full bg-stage-sirve transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {done ? (
          <div className="flex flex-1 flex-col gap-4 px-6 pt-10 pb-6">
            <h1 className="m-0 font-display-x text-[34px] leading-[.9]">¡Listo!</h1>
            <p className="m-0 text-[15px] leading-[1.45] text-ink/70">
              Tus resultados son solo para ti. Te mostraremos dónde podrías explorar servir — nunca es una etiqueta.
            </p>
            <div className="flex-1" />
            {saveGifts.isError ? (
              <p role="alert" className="m-0 text-sm font-semibold text-coral">
                {saveGifts.error.message}
              </p>
            ) : null}
            <Button variant="ink" size="lg" block className="h-[58px]" loading={saveGifts.isPending} onClick={finish}>
              Ver mis dones
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-5 px-6 pt-8 pb-6">
            <span className="eyebrow text-ink/50">
              {index + 1} de {GIFT_STATEMENTS.length}
            </span>
            <h1 className="m-0 text-[26px] leading-[1.2] font-bold">{statement.text}</h1>
            <div className="flex flex-col gap-2" role="radiogroup" aria-label="Qué tanto te describe">
              {AGREEMENT.map((label, i) => {
                const value = i + 1;
                const on = answers[statement.id] === value;
                return (
                  <button
                    key={label}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      setAnswers((a) => ({ ...a, [statement.id]: value }));
                      setIndex((n) => n + 1);
                    }}
                    className={cn(
                      "h-[54px] rounded-[18px] px-5 text-left text-base font-semibold",
                      on ? "bg-ink text-white" : "bg-white",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex-1" />
            {index > 0 ? (
              <Button variant="ghost" size="md" onClick={() => setIndex((n) => n - 1)}>
                Anterior
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
