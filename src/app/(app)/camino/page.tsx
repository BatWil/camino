import type { Metadata } from "next";
import Link from "next/link";
import { JourneyHeader } from "@/features/journey/components/journey-header";
import { JourneyMap } from "@/features/journey/components/journey-map";

export const metadata: Metadata = { title: "Mi Camino" };

export default function CaminoPage() {
  return (
    <>
      <JourneyHeader />
      <div className="pt-6">
        <JourneyMap />
      </div>
      <div className="px-3 pt-4">
        <Link href="/recursos" className="flex items-center justify-between rounded-[22px] bg-white px-[18px] py-4">
          <span className="flex flex-col gap-1">
            <span className="eyebrow text-ink/50">Recursos</span>
            <span className="text-[15px] font-bold">Diario guiado y libros</span>
          </span>
          <span aria-hidden>→</span>
        </Link>
      </div>
    </>
  );
}
