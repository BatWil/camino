import type { Metadata } from "next";
import { ChurchHero } from "@/features/churches/components/church-hero";
import { CommunityHub } from "@/features/community/components/community-hub";

export const metadata: Metadata = { title: "Comunidad" };

/** Comunidad (screen 2h): centred on the local church, no likes, no followers. */
export default function ComunidadPage() {
  return (
    <div className="pt-1">
      <ChurchHero />
      <CommunityHub />
    </div>
  );
}
