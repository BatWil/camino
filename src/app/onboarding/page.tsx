import type { Metadata } from "next";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { OnboardingEntry } from "@/features/onboarding/components/onboarding-entry";

export const metadata: Metadata = { title: "Tu camino" };

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <OnboardingEntry />
    </AuthGuard>
  );
}
