"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SplashState } from "@/components/layout/splash-state";
import { StateView } from "@/components/feedback/state-view";
import { useAuth } from "@/features/auth/hooks/use-auth";

/** Entry point (PWA start_url and native launch): route by session state. */
export default function EntryPage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/inicio");
    if (status === "unauthenticated") router.replace("/bienvenida");
  }, [status, router]);

  if (status === "unconfigured") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] items-center px-3">
        <StateView kind="unconfigured" className="w-full" />
      </main>
    );
  }
  return <SplashState />;
}
