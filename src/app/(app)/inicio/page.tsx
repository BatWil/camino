import type { Metadata } from "next";
import { ChallengeHomeCard } from "@/features/challenges/components/challenge-home-card";
import { CheckinHomeCard } from "@/features/checkin/components/checkin-home-card";
import { HomeEventCard, HomeSeriesCard } from "@/features/community/components/home-church-cards";
import { ChurchInviteCard } from "@/features/churches/components/church-invite-card";
import { HomeJourneyCard } from "@/features/journey/components/home-journey-card";
import { PrayerHomeCard } from "@/features/prayer/components/prayer-home-card";
import { HomeHeader } from "@/features/profile/components/home-header";
import { RhythmCard } from "@/features/rhythm/components/rhythm-card";
import { TodayCard } from "@/features/today/components/today-card";

export const metadata: Metadata = { title: "Inicio" };

/**
 * Home (screen 2c): greeting → Mi Camino → Tu ritmo + Oración → Hoy → Reto de la semana
 * → Serie de la iglesia → próximo evento.
 */
export default function InicioPage() {
  return (
    <div className="stagger flex flex-col gap-3 px-5 pt-3.5">
      <HomeHeader />
      <HomeJourneyCard />
      <div className="grid grid-cols-2 gap-3">
        <RhythmCard />
        <PrayerHomeCard />
      </div>
      <TodayCard />
      <ChallengeHomeCard />
      <HomeSeriesCard />
      <HomeEventCard />
      <CheckinHomeCard />
      <ChurchInviteCard />
    </div>
  );
}
