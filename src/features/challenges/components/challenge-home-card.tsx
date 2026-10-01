"use client";

import Link from "next/link";
import { useChallenge } from "../hooks/use-challenge";

/** "RETO DE LA SEMANA" lime card of screen 2c. */
export function ChallengeHomeCard() {
  const { challenge, checkins } = useChallenge();
  if (!challenge) return null;
  const done = checkins.data?.length ?? 0;
  const target = challenge.days_target;

  return (
    <Link
      href={`/reto/?id=${challenge.id}`}
      className="flex flex-col gap-3 rounded-[26px] bg-lime p-5 text-ink"
      aria-label={`Reto de la semana: ${challenge.title}, ${done} de ${target} días`}
    >
      <div className="flex justify-between">
        <span className="eyebrow">Reto de la semana</span>
        <span className="text-[13px] font-bold">
          {done} / {target} días
        </span>
      </div>
      <span className="font-display-x text-2xl leading-[.95]">{challenge.title}</span>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${target}, minmax(0, 1fr))` }} aria-hidden>
        {Array.from({ length: target }, (_, i) => (
          <div key={i} className={i < done ? "h-2.5 rounded-[5px] bg-ink" : "h-2.5 rounded-[5px] bg-ink/15"} />
        ))}
      </div>
    </Link>
  );
}
