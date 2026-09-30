"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      className="animate-fade-in fixed inset-x-3 z-40 flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[13px] font-semibold text-paper shadow-lg"
      style={{ top: "calc(var(--safe-top) + 8px)" }}
    >
      <WifiOff className="size-4 text-lime" aria-hidden />
      Sin conexión · seguimos cuando vuelvas
    </div>
  );
}
