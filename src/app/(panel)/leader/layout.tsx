"use client";

import { AuthGuard } from "@/features/auth/components/auth-guard";
import { RoleGuard } from "@/features/auth/components/role-guard";
import { canAccessLeaderPanel } from "@/features/churches/domain/access";
import { useLeaderOverview } from "@/features/leader/hooks/use-leader";
import { PanelShell, type PanelNavItem } from "@/features/panel/components/panel-shell";

// Sidebar from screen 3a. Sections without href are delivered in later milestones.
// "Mentores" lives inside Jóvenes (assignment + requests).
const ITEMS: PanelNavItem[] = [
  { label: "Dashboard", href: "/leader" },
  { label: "Jóvenes", href: "/leader/jovenes" },
  { label: "Grupos" },
  { label: "Contenido" },
  { label: "Series", href: "/leader/series" },
  { label: "Eventos", href: "/leader/eventos" },
  { label: "Mentores", href: "/leader/jovenes#mentores" },
  { label: "Preguntas", href: "/leader/preguntas" },
  { label: "Servicio", href: "/leader/servicio" },
  { label: "Ministerios", href: "/leader/ministerios" },
  { label: "Analítica" },
];

export default function LeaderLayout({ children }: LayoutProps<"/leader">) {
  const overview = useLeaderOverview();
  const items = ITEMS.map((i) => (i.label === "Preguntas" ? { ...i, badge: overview.data?.newQuestions } : i));
  return (
    <AuthGuard>
      <RoleGuard allow={canAccessLeaderPanel}>
        <PanelShell badge="LÍDER" items={items} footer={[{ label: "Configuración" }]}>
          {children}
        </PanelShell>
      </RoleGuard>
    </AuthGuard>
  );
}
