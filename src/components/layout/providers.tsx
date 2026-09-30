"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/features/auth/components/auth-provider";
import { OfflineBanner } from "@/components/feedback/offline-banner";
import { ROOT_PATHS } from "@/components/navigation/nav-config";
import { analytics } from "@/lib/analytics";
import { initNativeShell } from "@/lib/native/bridge";
import { getPlatform } from "@/lib/platform";
import { registerServiceWorker } from "@/lib/pwa/register-service-worker";
import { createQueryClient } from "@/lib/query/query-client";

function PlatformBootstrap() {
  const router = useRouter();
  const pathname = usePathname();
  const pathRef = useRef(pathname);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const platform = getPlatform();
    document.documentElement.dataset.platform = platform;
    analytics.track("app_opened", { platform });
    void registerServiceWorker();

    let dispose: (() => void) | undefined;
    let cancelled = false;
    void initNativeShell({
      navigate: (path) => router.push(path),
      goBack: () => router.back(),
      isAtRoot: () => ROOT_PATHS.has(pathRef.current.replace(/\/$/, "") || "/"),
    }).then((fn) => {
      if (cancelled) fn();
      else dispose = fn;
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [router]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PlatformBootstrap />
        <OfflineBanner />
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
