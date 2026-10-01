import { Suspense, type ReactNode } from "react";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { OnboardingGate } from "@/features/onboarding/components/onboarding-gate";
import { SplashState } from "./splash-state";

/** Full-screen signed-in page without the tab bar (devotional, plan, challenge). */
export function SignedInPage({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <OnboardingGate>
        <Suspense fallback={<SplashState />}>
          <div className="animate-page-in">{children}</div>
        </Suspense>
      </OnboardingGate>
    </AuthGuard>
  );
}
