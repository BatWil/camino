"use client";

import { tap } from "@/lib/native/haptics";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
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
  const floating = useAppStore((s) => s.preferences.navStyle === "floating");
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
          "flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors duration-200 max-[359px]:text-[10px]",
          active ? "text-lime" : "text-paper/55",
        )}
      >
        <span className="relative flex h-7 w-12 items-center justify-center">
          <span
            className={cn(
              "absolute inset-0 rounded-full bg-lime/15 transition-[scale,opacity] duration-300 ease-[var(--ease-out-soft)]",
              active ? "scale-100 opacity-100" : "scale-50 opacity-0",
            )}
            aria-hidden
          />
          <Icon
            className={cn("relative size-[22px] transition-transform duration-300", active && "-translate-y-px")}
            strokeWidth={active ? 2.4 : 2}
            aria-hidden
          />
        </span>
        {tab.label}
      </Link>
    );
  };

  const plus = (
    <button
      type="button"
      onClick={() => {
        tap();
        onQuickActions();
      }}
      aria-label={quickActionsOpen ? "Cerrar acciones rápidas" : "Acciones rápidas"}
      aria-expanded={quickActionsOpen}
      aria-haspopup="dialog"
      className={cn(
        "absolute left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full bg-lime text-ink transition-transform duration-200 active:scale-95",
        floating
          ? "-top-4 size-[60px] shadow-[0_10px_24px_-8px_rgba(13,10,38,.6)] ring-[5px] ring-ink"
          : "bottom-9 size-[66px] shadow-[0_10px_24px_-8px_rgba(13,10,38,.6)] ring-[6px] ring-ink",
      )}
    >
      <Plus
        className={cn("size-7 transition-transform duration-200", quickActionsOpen && "rotate-45")}
        strokeWidth={2.6}
        aria-hidden
      />
    </button>
  );

  if (floating) {
    // Floating pill: inset from the edges and lifted above the home indicator.
    return (
      <nav
        aria-label="Navegación principal"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 lg:hidden"
        style={{ paddingBottom: "calc(var(--safe-bottom) + 12px)" }}
      >
        <div className="pointer-events-auto relative mx-auto flex h-[68px] max-w-[560px] items-center rounded-full border border-white/10 bg-ink px-2 text-paper shadow-[0_16px_40px_-12px_rgba(13,10,38,.55)]">
          {left.map(renderTab)}
          <div className="w-[64px] shrink-0 min-[360px]:w-[72px]" aria-hidden />
          {right.map(renderTab)}
          {plus}
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-50 bg-ink text-paper lg:hidden"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="relative mx-auto flex h-[84px] max-w-[600px] items-center px-2 pb-3">
        {left.map(renderTab)}
        <div className="w-[68px] shrink-0 min-[360px]:w-[76px]" aria-hidden />
        {right.map(renderTab)}
        {plus}
      </div>
    </nav>
  );
}
