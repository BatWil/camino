import type { Metadata } from "next";
import { ScreenHeader } from "@/components/ui/screen-header";
import { JourneyStageStack } from "@/features/journey/components/journey-stage-stack";

export const metadata: Metadata = { title: "Mi Camino" };

export default function CaminoPage() {
  return (
    <>
      <ScreenHeader
        title={
          <>
            TU
            <br />
            CAMINO
          </>
        }
        subtitle="6 etapas · sin prisa"
      />
      <JourneyStageStack />
    </>
  );
}
