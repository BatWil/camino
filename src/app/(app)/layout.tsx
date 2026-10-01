import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { OnboardingGate } from "@/features/onboarding/components/onboarding-gate";

export default function SignedInLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthGuard>
      <OnboardingGate>
        <AppShell>{children}</AppShell>
      </OnboardingGate>
    </AuthGuard>
  );
}
