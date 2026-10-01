"use client";

import Link from "next/link";
import { cn } from "@/utils/cn";
import type { Prayer } from "../data/prayer.repository";
import { CATEGORY_LABEL, PRIVACY_LABEL, answeredLabel, daysBetween, daysLabel } from "../domain/prayer";
import { usePrayerMutations } from "../hooks/use-prayers";

/** Prayer request card of screen 2f, with the "Marcar respondida" micro-celebration. */
export function PrayerCard({ prayer, groupName }: { prayer: Prayer; groupName?: string }) {
  const { setStatus } = usePrayerMutations();
  const answered = prayer.status === "ANSWERED";
  const shared =
    prayer.privacy === "GROUP"
      ? `compartida con ${groupName ?? "mi grupo"}`
      : prayer.privacy === "CHURCH"
        ? "compartida con mi iglesia"
        : prayer.privacy === "MENTOR"
          ? "para mi mentor"
          : null;

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-[26px] p-5 transition-[background,transform] duration-500",
        answered ? "-rotate-1 scale-[1.02] bg-lime" : "bg-white",
      )}
      aria-label={prayer.title}
    >
      <div className="flex items-center justify-between">
        <span className="eyebrow">{CATEGORY_LABEL[prayer.category]}</span>
        <span
          className={cn(
            "rounded-full px-2.5 py-[5px] text-xs font-bold",
            answered ? "bg-ink text-lime" : "bg-lilac text-violet",
          )}
        >
          {answered ? "✦ Respondida" : "Sigo orando"}
        </span>
      </div>
      <Link href={`/oracion/peticion/?id=${prayer.id}`} className="text-[17px] leading-[1.35] font-semibold">
        “{prayer.title}”
      </Link>
      {answered && prayer.answered_at ? (
        <span className="animate-fade-in font-hand text-[28px] leading-none" role="status">
          {answeredLabel(prayer.created_at, prayer.answered_at)}
        </span>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-ink/60">
          {daysLabel(daysBetween(prayer.created_at))}
          {shared ? ` · ${shared}` : ""}
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={setStatus.isPending}
            onClick={() => setStatus.mutate({ id: prayer.id, status: answered ? "PRAYING" : "ANSWERED" })}
            className="flex h-10 items-center rounded-full border-[1.5px] border-ink px-3.5 text-[13px] font-semibold"
          >
            {answered ? "Deshacer" : "Marcar respondida"}
          </button>
          {!answered ? (
            <Link
              href={`/oracion/modo/?min=5&peticion=${prayer.id}`}
              className="flex h-10 items-center rounded-full bg-ink px-3.5 text-[13px] font-semibold text-white"
            >
              Orar ahora
            </Link>
          ) : null}
        </div>
      </div>
      <span className="sr-only">Privacidad: {PRIVACY_LABEL[prayer.privacy]}</span>
    </article>
  );
}
