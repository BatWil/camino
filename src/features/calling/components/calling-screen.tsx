"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import { callingSteps } from "../domain/calling";
import { useCalling } from "../hooks/use-calling";

/** Screen 8g · Llamados · discernir mi llamado. Private: only the youth sees this journey. */
export function CallingScreen() {
  const router = useRouter();
  const { progress, stories, start, askPastor, exploreStudies, hasChurch } = useCalling();
  const p = progress.data;
  const steps = p ? callingSteps(p) : [];
  const story = stories.data?.[0];

  const detail = (id: string, state: string, months?: number) => {
    const muted = state === "next";
    if (id === "plan") {
      if (state === "done") return <span className="text-xs text-paper/55">5 días · completado</span>;
      return p?.planId ? (
        <Link href={`/plan/?id=${p.planId}`} className="text-xs text-lime">
          Empezar el plan →
        </Link>
      ) : null;
    }
    if (id === "pastor") {
      if (state === "done") return <span className="text-xs text-paper/55">Solicitud enviada a tu pastor</span>;
      if (!hasChurch) return <span className="text-xs text-paper/55">Únete a tu iglesia para pedirla</span>;
      return (
        <button
          type="button"
          disabled={askPastor.isPending}
          onClick={() => askPastor.mutate()}
          className={cn("text-left text-xs", muted ? "text-paper/70" : "text-lime")}
        >
          Agendar conversación →
        </button>
      );
    }
    if (id === "serve") {
      if (state === "done") return <span className="text-xs text-paper/55">3 meses o más sirviendo</span>;
      return (
        <Link href="/servir" className={cn("text-xs", muted ? "text-paper/40" : "text-lime")}>
          {months ? `Llevas ${months} ${months === 1 ? "mes" : "meses"} · ` : ""}Ver dónde servir →
        </Link>
      );
    }
    if (state === "done") return <span className="text-xs text-paper/55">Explorado</span>;
    return (
      <span className="flex gap-3 text-xs">
        <Link href="/recursos" className={muted ? "text-paper/40" : "text-lime"}>
          Ver recursos →
        </Link>
        {p?.started ? (
          <button type="button" onClick={() => exploreStudies.mutate()} className="text-paper/70 underline">
            Ya lo exploré
          </button>
        ) : null}
      </span>
    );
  };

  return (
    <main className="min-h-dvh bg-ink text-paper">
      <div className="mx-auto flex min-h-dvh max-w-[600px] flex-col">
        <div className="px-5 pb-2" style={{ paddingTop: "calc(var(--safe-top) + 8px)" }}>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="flex size-10 items-center justify-center rounded-full bg-white/[.12]"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
        </div>
        <div className="flex flex-col gap-3 px-6 py-[22px]">
          <span className="font-mono text-[11px] font-semibold tracking-[.1em] text-stage-guia">
            LIDERAR · LLAMADOS
          </span>
          <h1 className="m-0 font-display-x text-[40px] leading-[.86] tracking-[-.03em]">
            ¿Dios te está <span className="text-lime">llamando?</span>
          </h1>
          <p className="m-0 text-[15px] leading-normal text-paper/78">
            Si sientes que Dios te llama al ministerio, no tienes que descubrirlo solo.
          </p>
        </div>
        <div className="flex flex-col gap-2.5 px-3" style={{ paddingBottom: "calc(var(--safe-bottom) + 30px)" }}>
          {progress.isPending ? (
            <Skeleton className="h-60 rounded-3xl bg-white/10" />
          ) : (
            <ol className="m-0 flex list-none flex-col gap-1 rounded-3xl bg-white/[.07] p-[18px]">
              {steps.map((s, i) => (
                <li
                  key={s.id}
                  className={cn("flex min-h-[52px] items-center gap-3.5", s.state === "next" && "text-paper/60")}
                >
                  <span
                    className={cn(
                      "flex size-8 flex-none items-center justify-center rounded-full text-sm font-bold",
                      s.state === "done" && "bg-lime text-ink",
                      s.state === "current" && "bg-stage-guia",
                      s.state === "next" && "border-2 border-white/25",
                    )}
                  >
                    {s.state === "done" ? <Check className="size-4" aria-hidden /> : i + 1}
                  </span>
                  <span className="flex flex-col">
                    <span className={cn("text-[15px]", s.state === "next" ? "font-semibold" : "font-bold")}>
                      {s.title}
                    </span>
                    {detail(s.id, s.state, "months" in s ? s.months : undefined)}
                  </span>
                </li>
              ))}
            </ol>
          )}
          {story ? (
            <figure className="m-0 flex flex-col gap-1.5 rounded-3xl bg-stage-guia p-[18px] text-white">
              <span className="eyebrow">Historias</span>
              <blockquote className="m-0 text-base leading-[1.3] font-bold">
                “{story.quote}” — {story.author}
              </blockquote>
            </figure>
          ) : null}
          {p?.started ? (
            <div className="flex h-[58px] items-center justify-center rounded-full bg-white/10 text-base font-bold text-lime">
              Estás en este camino ✓
            </div>
          ) : (
            <Button
              variant="lime"
              size="lg"
              block
              className="h-[58px]"
              loading={start.isPending}
              onClick={() => start.mutate()}
            >
              Siento el llamado
            </Button>
          )}
          <span className="text-center text-xs text-paper/55">
            Esto es privado. Solo tú lo ves; tú decides con quién hablarlo.
          </span>
        </div>
      </div>
    </main>
  );
}
