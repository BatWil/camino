import type { Metadata } from "next";
import { SignedInPage } from "@/components/layout/signed-in-page";
import { ChallengePage } from "@/features/challenges/components/challenge-page";

export const metadata: Metadata = { title: "Reto de la semana" };

export default function Page() {
  return (
    <SignedInPage>
      <ChallengePage />
    </SignedInPage>
  );
}
