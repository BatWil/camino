"use client";

import { AuthGuard } from "@/features/auth/components/auth-guard";
import { RoleGuard } from "@/features/auth/components/role-guard";
import { canAccessLeaderPanel } from "@/features/churches/domain/access";
import { PanelShell, type PanelNavItem } from "@/features/panel/components/panel-shell";

// Sidebar from screen 3a. Sections without href are delivered in later milestones.
const ITEMS: PanelNavItem[] = [
  { label: "Dashboard", href: "/leader" },
  { label: "Jóvenes" },
  { label: "Grupos" },
  { label: "Contenido" },
  { label: "Series" },
  { label: "Eventos" },
  { label: "Mentores" },
  { label: "Preguntas" },
  { label: "Servicio" },
  { label: "Analítica" },
];

export default function LeaderLayout({ children }: LayoutProps<"/leader">) {
  return (
    <AuthGuard>
      <RoleGuard allow={canAccessLeaderPanel}>
        <PanelShell badge="LÍDER" items={ITEMS} footer={[{ label: "Configuración" }]}>
          {children}
        </PanelShell>
      </RoleGuard>
    </AuthGuard>
  );
}
