import type { Metadata } from "next";
import { Suspense } from "react";
import { SplashState } from "@/components/layout/splash-state";
import { WelcomeScreen } from "@/features/auth/components/welcome-screen";

export const metadata: Metadata = { title: "Bienvenida" };

export default function BienvenidaPage() {
  return (
    <Suspense fallback={<SplashState />}>
      <WelcomeScreen />
    </Suspense>
  );
}
