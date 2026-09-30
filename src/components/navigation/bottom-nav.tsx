"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/utils/cn";
import { NAV_TABS, isTabActive, type NavTab } from "./nav-config";

/**
 * Mobile bottom navigation (84px + safe area). The design imports a "Camino Nav"
 * component with tabs Inicio · Camino · + · Comunidad · Perfil and a 66px
 * central "+" hotspot anchored 36px from the bottom; this is its implementation.
 */
export function BottomNav({
  onQuickActions,
  quickActionsOpen,
}: {
  onQuickActions: () => void;
  quickActionsOpen: boolean;
}) {
  const pathname = usePathname();
  const [left, right] = [NAV_TABS.slice(0, 2), NAV_TABS.slice(2)];

  const renderTab = (tab: NavTab) => {
    const active = isTabActive(pathname, tab.href);
    const Icon = tab.icon;
    return (
      <Link
        key={tab.href}
        href={tab.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-12 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold",
          active ? "text-lime" : "text-paper/55",
        )}
      >
        <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 2} aria-hidden />
        {tab.label}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-50 bg-ink text-paper lg:hidden"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="relative mx-auto flex h-[84px] max-w-[600px] items-center px-2 pb-3">
        {left.map(renderTab)}
        <div className="w-[76px] shrink-0" aria-hidden />
        {right.map(renderTab)}
        <button
          type="button"
          onClick={onQuickActions}
          aria-label={quickActionsOpen ? "Cerrar acciones rápidas" : "Acciones rápidas"}
          aria-expanded={quickActionsOpen}
          aria-haspopup="dialog"
          className="absolute bottom-9 left-1/2 flex size-[66px] -translate-x-1/2 items-center justify-center rounded-full bg-lime text-ink shadow-[0_10px_24px_-8px_rgba(13,10,38,.6)] ring-[6px] ring-ink transition-transform duration-200 active:scale-95"
        >
          <Plus
            className={cn("size-7 transition-transform duration-200", quickActionsOpen && "rotate-45")}
            strokeWidth={2.6}
            aria-hidden
          />
        </button>
      </div>
    </nav>
  );
}
