"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/ui/brand-mark";
import { cn } from "@/utils/cn";

export interface PanelNavItem {
  label: string;
  href?: string; // undefined = section not built yet (rendered disabled)
}

/**
 * Desktop panel layout (screen 3a): 240px ink sidebar + paper content.
 * Separate from the young person's AppShell on purpose.
 */
export function PanelShell({
  badge,
  items,
  footer,
  children,
}: {
  badge: string;
  items: PanelNavItem[];
  footer?: PanelNavItem[];
  children: ReactNode;
}) {
  const pathname = usePathname().replace(/\/$/, "");

  const renderItem = (item: PanelNavItem) => {
    if (!item.href) {
      return (
        <span
          key={item.label}
          aria-disabled="true"
          title="Disponible próximamente"
          className="cursor-not-allowed px-3 py-[11px] text-sm text-paper/35"
        >
          {item.label}
        </span>
      );
    }
    const active = pathname === item.href;
    return (
      <Link
        key={item.label}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "rounded-xl px-3 py-[11px] text-sm",
          active ? "bg-lime/15 font-semibold text-lime" : "text-paper/75 hover:text-paper",
        )}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <div className="flex min-h-dvh flex-col bg-paper md:grid md:grid-cols-[240px_1fr]">
      <aside className="flex flex-col gap-1 bg-ink px-4 py-[26px] text-paper md:sticky md:top-0 md:h-dvh">
        <BrandMark className="px-2.5 pb-[26px]" size={17} badge={badge} />
        <nav
          aria-label={`Navegación ${badge.toLowerCase()}`}
          className="flex flex-wrap gap-1 md:flex-col md:flex-nowrap"
        >
          {items.map(renderItem)}
        </nav>
        <div className="hidden flex-1 md:block" />
        <nav aria-label="Panel secundario" className="flex flex-col gap-1">
          {(footer ?? []).map(renderItem)}
          <Link href="/inicio" className="px-3 py-[11px] text-sm text-paper/75 hover:text-paper">
            ← Volver a Camino
          </Link>
        </nav>
      </aside>
      <main id="contenido" className="flex flex-col gap-[18px] px-5 py-8 md:px-9">
        {children}
      </main>
    </div>
  );
}
