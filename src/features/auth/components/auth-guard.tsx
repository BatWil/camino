"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { StateView } from "@/components/feedback/state-view";
import { SplashState } from "@/components/layout/splash-state";
import { useAuth } from "../hooks/use-auth";

/**
 * Client-side route guard for the signed-in area. This only controls what is
 * rendered; data access is enforced by Row Level Security on the server.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/bienvenida");
  }, [status, router]);

  if (status === "unconfigured") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] items-center px-3">
        <StateView kind="unconfigured" className="w-full" />
      </main>
    );
  }
  if (status !== "authenticated") return <SplashState />;
  return <>{children}</>;
}
