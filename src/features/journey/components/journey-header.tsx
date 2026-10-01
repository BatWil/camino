"use client";

import Link from "next/link";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useCurrentStage } from "../hooks/use-current-stage";

export function JourneyHeader() {
  const { stage, stages } = useCurrentStage();
  return (
    <ScreenHeader
      title={
        <>
          TU
          <br />
          CAMINO
        </>
      }
      subtitle={stage ? `Etapa ${stage.position} de ${stages.length} · sin prisa` : "Paso a paso · sin prisa"}
      action={
        <Link href="/planes" className="mt-2 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold">
          Planes
        </Link>
      }
    />
  );
}
