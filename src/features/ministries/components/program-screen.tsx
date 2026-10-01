"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { StateView } from "@/components/feedback/state-view";
import { fitTitleStyle } from "@/utils/fit-title";
import { PROGRAM_DETAIL, programById } from "../domain/programs";

/** Programs without a dedicated design screen (Deportes, Youth Alive): same visual language as 8f/8g. */
export function ProgramScreen() {
  const router = useRouter();
  const program = programById(useSearchParams().get("id"));
  const detail = program ? PROGRAM_DETAIL[program.id] : null;
  if (!program || !detail) {
    return (
      <main className="pt-safe flex min-h-dvh items-center bg-paper px-5">
        <StateView kind="empty" title="Ministerio no encontrado" />
      </main>
    );
  }
  return (
    <main className="min-h-dvh" style={{ background: program.bg, color: program.fg }}>
      <div className="mx-auto flex min-h-dvh max-w-[600px] flex-col">
        <div className="px-5 pb-2" style={{ paddingTop: "calc(var(--safe-top) + 8px)" }}>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="flex size-10 items-center justify-center rounded-full bg-white/35"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
        </div>
        <div className="@container flex flex-col gap-3 px-6 pt-5 pb-6">
          <span className="font-mono text-[11px] font-semibold tracking-[.1em]">{program.pillar}</span>
          <h1
            className="m-0 font-display-x text-[40px] leading-[.86] tracking-[-.03em]"
            style={fitTitleStyle(program.title, 40)}
          >
            {program.title}
          </h1>
          <p className="m-0 text-[15px] leading-[1.45] font-medium">{detail.lead}</p>
        </div>
        <div
          className="flex flex-1 flex-col gap-2.5 rounded-t-[32px] bg-paper px-3 pt-[22px] text-ink"
          style={{ paddingBottom: "calc(var(--safe-bottom) + 30px)" }}
        >
          <h2 className="m-0 px-3 text-[17px] font-bold">Cómo participar</h2>
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {detail.points.map((p, i) => (
              <li
                key={p}
                className="flex items-center gap-3 rounded-[22px] bg-white px-[18px] py-4 text-[15px] font-semibold"
              >
                <span className="flex size-7 flex-none items-center justify-center rounded-full bg-ink text-[13px] text-white">
                  {i + 1}
                </span>
                {p}
              </li>
            ))}
          </ol>
          <ButtonLink href="/eventos" variant="ink" size="lg" block className="mt-2 h-[58px]">
            Ver eventos de mi iglesia
          </ButtonLink>
          <ButtonLink
            href="/servir"
            variant="ghost"
            size="md"
            block
            className="h-[50px] border-[1.5px] border-ink/20 text-sm font-semibold"
          >
            Quiero servir aquí
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
