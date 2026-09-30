import type { Metadata } from "next";
import { ChurchHero } from "@/features/churches/components/church-hero";

export const metadata: Metadata = { title: "Comunidad" };

/**
 * Comunidad (screen 2h): centred on the local church, no likes, no followers.
 * Serie, grupo, mentor, eventos, peticiones y servicio arrive in M4.
 */
export default function ComunidadPage() {
  return (
    <div className="pt-1">
      <ChurchHero />
    </div>
  );
}
