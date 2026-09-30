import type { Metadata } from "next";
import { PanelGreeting } from "@/features/panel/components/panel-greeting";
import { PrivacyDesignCard } from "@/features/panel/components/privacy-design-card";
import { StateView } from "@/components/feedback/state-view";

export const metadata: Metadata = { title: "Panel de líder" };

export default function LeaderDashboardPage() {
  return (
    <>
      <PanelGreeting />
      <div className="grid gap-3.5 lg:grid-cols-[1fr_360px]">
        <StateView
          kind="empty"
          title="Tu tablero se está preparando"
          message="Aquí verás el acompañamiento de tus jóvenes: etapa, plan actual y participación. Nunca su contenido privado."
        />
        <PrivacyDesignCard />
      </div>
    </>
  );
}
