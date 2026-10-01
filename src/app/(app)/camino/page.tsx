import type { Metadata } from "next";
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
    </>
  );
}
