import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { JourneyStageBars } from "@/features/journey/components/journey-stage-stack";
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
      <section className="flex flex-col gap-4 rounded-[30px] bg-ink p-[22px] text-paper" aria-labelledby="home-camino">
        <div className="flex flex-col gap-1.5">
          <span className="eyebrow tracking-[.12em] text-paper/55">Mi camino · 6 etapas</span>
          <h2 id="home-camino" className="m-0 font-display-x text-[42px] leading-[.9] text-lime">
            Paso a paso
          </h2>
        </div>
        <JourneyStageBars />
        <ButtonLink href="/camino" variant="lime" size="md" block>
          Ver mi camino
        </ButtonLink>
      </section>
      <ChurchInviteCard />
    </div>
  );
}
