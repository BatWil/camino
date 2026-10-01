import type { Metadata } from "next";
import { ChallengeHomeCard } from "@/features/challenges/components/challenge-home-card";
import { ChurchInviteCard } from "@/features/churches/components/church-invite-card";
import { HomeJourneyCard } from "@/features/journey/components/home-journey-card";
import { HomeHeader } from "@/features/profile/components/home-header";
import { RhythmCard } from "@/features/rhythm/components/rhythm-card";
import { TodayCard } from "@/features/today/components/today-card";

export const metadata: Metadata = { title: "Inicio" };

/**
 * Home (screen 2c): greeting → Mi Camino → Tu ritmo → Hoy → Reto de la semana.
 * Oración (M3), serie de la iglesia y próximo evento (M4) join this column later.
 */
export default function InicioPage() {
  return (
    <div className="flex flex-col gap-3 px-5 pt-3.5">
      <HomeHeader />
      <HomeJourneyCard />
      <RhythmCard />
      <TodayCard />
      <ChallengeHomeCard />
      <ChurchInviteCard />
    </div>
  );
}
