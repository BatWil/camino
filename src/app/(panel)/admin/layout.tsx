"use client";

import { AuthGuard } from "@/features/auth/components/auth-guard";
import { RoleGuard } from "@/features/auth/components/role-guard";
import { canAccessAdminPanel } from "@/features/churches/domain/access";
import { PanelShell, type PanelNavItem } from "@/features/panel/components/panel-shell";

const ITEMS: PanelNavItem[] = [
  { label: "Resumen", href: "/admin" },
  { label: "Iglesias" },
  { label: "Roles" },
  { label: "Ministerios" },
  { label: "Auditoría" },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AuthGuard>
      <RoleGuard allow={canAccessAdminPanel}>
        <PanelShell badge="ADMIN" items={ITEMS} footer={[{ label: "Configuración" }]}>
          {children}
        </PanelShell>
      </RoleGuard>
    </AuthGuard>
  );
}
