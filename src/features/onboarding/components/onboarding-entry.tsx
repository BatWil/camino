"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StateView } from "@/components/feedback/state-view";
import { SplashState } from "@/components/layout/splash-state";
import { hasCompletedOnboarding } from "@/features/profile/domain/profile";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { OnboardingFlow } from "./onboarding-flow";

export function OnboardingEntry() {
  const profile = useProfile();
  const router = useRouter();
  const done = profile.isSuccess && hasCompletedOnboarding(profile.data);

  useEffect(() => {
    if (done) router.replace("/inicio");
  }, [done, router]);

  if (profile.isError) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] items-center px-3">
        <StateView
          kind="error"
          className="w-full"
          action={
            <Button variant="ink" size="sm" onClick={() => profile.refetch()}>
              Reintentar
            </Button>
          }
        />
      </main>
    );
  }
  if (!profile.isSuccess || done) return <SplashState />;
  return <OnboardingFlow initialName={profile.data?.display_name ?? ""} />;
}
