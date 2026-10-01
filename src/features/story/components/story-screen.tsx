"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { stageTheme } from "@/features/journey/domain/stages";
import { useCurrentStage } from "@/features/journey/hooks/use-current-stage";
import { MOMENT_META } from "@/features/moments/domain/moments";
import { useMoments, useStory } from "@/features/moments/hooks/use-moments";
import { fitTitleStyle } from "@/utils/fit-title";
import { relativeSince, storyLines } from "../domain/story";

/** "Mi historia · Mira cuánto has recorrido": a narrative, not a dashboard. */
export function StoryScreen() {
  const { stats, first } = useStory();
  const moments = useMoments();
  const { stage } = useCurrentStage();

  if (stats.isPending || moments.isPending) {
    return (
      <div className="min-h-dvh bg-ink px-6 pt-10">
        <Skeleton className="h-80 opacity-20" />
      </div>
    );
  }
  const s = stats.data;
  const lines = s ? storyLines(s) : [];
  const recent = (moments.data ?? []).slice(0, 4);

  return (
    <div className="bleed-nav @container min-h-dvh bg-ink px-6 pt-8 text-paper">
      <span className="eyebrow text-lime">Mi historia</span>
      <h1
        className="m-0 mt-2 font-display-x leading-[.86] tracking-[-.03em]"
        style={fitTitleStyle("Mira cuánto has recorrido.", 44)}
      >
        Mira cuánto
        <br />
        has <span className="text-lime">recorrido.</span>
      </h1>

      <div className="mt-8 flex flex-col gap-5 text-[17px] leading-[1.55]">
        {s?.startedAt ? <p className="m-0">Empezaste tu camino {relativeSince(s.startedAt)}.</p> : null}
        {first.data ? (
          <figure className="m-0 flex flex-col gap-2 rounded-[22px] bg-white/[.06] p-5">
            <figcaption className="text-sm text-paper/60">
              {relativeSince(first.data.created_at).replace(/^h/, "H")} escribiste en tu diario:
            </figcaption>
            <blockquote className="m-0 font-serif text-[17px] italic">
              “{first.data.body.slice(0, 180)}
              {first.data.body.length > 180 ? "…" : ""}”
            </blockquote>
          </figure>
        ) : null}
        {lines.length ? (
          <div className="flex flex-col gap-2">
            <p className="m-0 font-semibold text-paper/70">Desde entonces…</p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {lines.map((l) => (
                <li key={l} className="flex gap-2.5">
                  <span className="text-lime" aria-hidden>
                    ✦
                  </span>
                  {l}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="m-0 text-paper/75">Tu historia apenas comienza. Cada paso que des quedará aquí.</p>
        )}
        {stage ? (
          <p className="m-0">
            Hoy estás en <strong style={{ color: stageTheme(stage.key).color }}>{stage.name}</strong>.
          </p>
        ) : null}
      </div>

      {recent.length ? (
        <section className="mt-8 flex flex-col gap-3" aria-labelledby="story-moments">
          <h2 id="story-moments" className="m-0 eyebrow text-paper/60">
            Momentos
          </h2>
          <ol className="m-0 flex list-none flex-col gap-3 border-l-2 border-paper/15 p-0 pl-5">
            {recent.map((m) => (
              <li key={m.id} className="relative">
                <span
                  className="absolute top-1.5 -left-[27px] size-3 rounded-full"
                  style={{ background: MOMENT_META[m.kind].color }}
                  aria-hidden
                />
                <span className="font-semibold">{m.title}</span>
                <span className="ml-2 text-sm text-paper/50">{relativeSince(`${m.happened_on}T12:00:00`)}</span>
              </li>
            ))}
          </ol>
          <Link href="/momentos" className="text-sm font-semibold text-lime">
            Ver todos mis momentos →
          </Link>
        </section>
      ) : null}

      <span className="mt-10 block -rotate-2 font-hand text-[30px] text-lime">un camino, no una competencia ✦</span>
      <ButtonLink href="/camino" variant="lime" size="lg" block className="mt-6">
        Seguir mi camino
      </ButtonLink>
    </div>
  );
}
