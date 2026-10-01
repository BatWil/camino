"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyPrayers } from "../hooks/use-prayers";

/** "ORACIÓN · 2 motivos pendientes · Entrar en oración" (lilac card of screen 2c). */
export function PrayerHomeCard() {
  const prayers = useMyPrayers();
  if (prayers.isPending) return <Skeleton className="h-[170px]" />;
  const pending = (prayers.data ?? []).filter((p) => p.status === "PRAYING").length;
  return (
    <section
      className="flex flex-col justify-between gap-2 rounded-[26px] bg-lilac p-[18px]"
      aria-labelledby="home-prayer"
    >
      <span className="eyebrow text-violet">Oración</span>
      <h2 id="home-prayer" className="m-0 text-xl leading-[1.15] font-bold">
        {pending === 0
          ? "Tu lugar de oración"
          : `${pending} ${pending === 1 ? "motivo pendiente" : "motivos pendientes"}`}
      </h2>
      <Link
        href="/oracion"
        className="flex h-10 items-center justify-center rounded-full bg-violet text-[13px] font-semibold text-white"
      >
        Entrar en oración
      </Link>
    </section>
  );
}
