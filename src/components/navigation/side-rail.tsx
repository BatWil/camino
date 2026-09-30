"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { cn } from "@/utils/cn";
import { NAV_TABS, isTabActive } from "./nav-config";

/**
 * Desktop (≥1024px) navigation: same destinations as the bottom nav, in the ink
 * sidebar language of the leader panel (screen 3a), so desktop is not a giant phone.
 */
export function SideRail({ onQuickActions }: { onQuickActions: () => void }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-[240px] shrink-0 flex-col gap-1 bg-ink px-4 py-[26px] text-paper lg:flex">
      <BrandMark className="px-2.5 pb-[26px]" size={17} />
      <nav aria-label="Navegación principal" className="flex flex-col gap-1">
        {NAV_TABS.map((tab) => {
          const active = isTabActive(pathname, tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-[11px] text-sm",
                active ? "bg-lime/15 font-semibold text-lime" : "text-paper/75 hover:text-paper",
              )}
            >
              <Icon className="size-[18px]" aria-hidden />
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex-1" />
      <button
        type="button"
        onClick={onQuickActions}
        className="flex h-[50px] items-center justify-center gap-2 rounded-full bg-lime text-[15px] font-bold text-ink"
      >
        <Plus className="size-5" aria-hidden /> ¿Qué quieres hacer?
      </button>
    </aside>
  );
}
