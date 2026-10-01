"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { QuickActionsSheet } from "@/components/navigation/quick-actions-sheet";
import { SideRail } from "@/components/navigation/side-rail";
import { useNotificationSetup } from "@/features/notifications/hooks/use-notifications";
import { useTimezoneSync } from "@/features/rhythm/hooks/use-rhythm";
import { useAppStore } from "@/stores/app-store";

/** Layout for the young person's app: content + bottom nav (mobile) / side rail (desktop). */
export function AppShell({ children }: { children: ReactNode }) {
  const [quickOpen, setQuickOpen] = useState(false);
  useTimezoneSync();
  useNotificationSetup();
  const navStyle = useAppStore((s) => s.preferences.navStyle);
  useEffect(() => {
    document.documentElement.dataset.nav = navStyle;
  }, [navStyle]);
  const toggle = useCallback(() => setQuickOpen((v) => !v), []);
  const close = useCallback(() => setQuickOpen(false), []);

  return (
    <div className="flex min-h-dvh bg-paper">
      <SideRail onQuickActions={toggle} />
      <main id="contenido" className="pb-nav pt-safe mx-auto w-full max-w-[600px] lg:max-w-[720px] lg:pb-12">
        {children}
      </main>
      <QuickActionsSheet open={quickOpen} onClose={close} />
      <BottomNav onQuickActions={toggle} quickActionsOpen={quickOpen} />
    </div>
  );
}
