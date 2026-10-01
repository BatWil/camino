import type { Metadata } from "next";
import { HomeJourneyCard } from "@/features/journey/components/home-journey-card";
import { HomeHeader } from "@/features/profile/components/home-header";
import { ChurchInviteCard } from "@/features/churches/components/church-invite-card";

export const metadata: Metadata = { title: "Inicio" };

/**
 * Home (screen 2c). M0 renders the frame: greeting and the "MI CAMINO" card.
 * "Mi paso de hoy", ritmo, plan, reto, oración, serie and próximo evento are
 * composed here in M2–M4 from real data.
 */
export default function InicioPage() {
  return (
    <div className="flex flex-col gap-3 px-5 pt-3.5">
      <HomeHeader />
      <HomeJourneyCard />
      <ChurchInviteCard />
    </div>
  );
}
