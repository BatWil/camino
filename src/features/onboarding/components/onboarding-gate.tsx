"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StateView } from "@/components/feedback/state-view";
import { SplashState } from "@/components/layout/splash-state";
import { hasCompletedOnboarding } from "@/features/profile/domain/profile";
import { useProfile } from "@/features/profile/hooks/use-profile";

/** Sends people who have not finished onboarding to /onboarding before the app. */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const profile = useProfile();
  const router = useRouter();
  const needsOnboarding = profile.isSuccess && !hasCompletedOnboarding(profile.data);

  useEffect(() => {
    if (needsOnboarding) router.replace("/onboarding");
  }, [needsOnboarding, router]);

  if (profile.isError) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] items-center px-3">
        <StateView
          kind="error"
          className="w-full"
          message="No pudimos cargar tu perfil."
          action={
            <Button variant="ink" size="sm" onClick={() => profile.refetch()}>
              Reintentar
            </Button>
          }
        />
      </main>
    );
  }
  if (!profile.isSuccess || needsOnboarding) return <SplashState />;
  return <>{children}</>;
}
