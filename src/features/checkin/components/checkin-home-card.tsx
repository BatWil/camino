"use client";

import Link from "next/link";
import { useCheckins } from "../hooks/use-checkin";

/** Gentle weekly invitation; disappears once this week's check-in exists. */
export function CheckinHomeCard() {
  const { history, current } = useCheckins();
  if (history.isPending || history.isError || current) return null;
  return (
    <Link
      href="/checkin"
      className="flex items-center justify-between gap-3 rounded-[26px] bg-white p-5"
      aria-label="Check-in semanal: ¿cómo estás esta semana?"
    >
      <span className="flex flex-col gap-1">
        <span className="eyebrow text-ink/50">Check-in semanal</span>
        <span className="text-[17px] font-bold">¿Cómo estás esta semana?</span>
        <span className="text-xs text-ink/55">Solo tú lo ves.</span>
      </span>
      <span className="flex gap-1" aria-hidden>
        {["#FFC83D", "#35D07F", "#3D8BFF", "#9B6BFF"].map((c) => (
          <span key={c} className="size-3 rounded-full" style={{ background: c }} />
        ))}
      </span>
    </Link>
  );
}
