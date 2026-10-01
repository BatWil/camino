import type { Metadata } from "next";
import { SignedInPage } from "@/components/layout/signed-in-page";
import { MissionsScreen } from "@/features/missions/components/missions-screen";

export const metadata: Metadata = { title: "Misiones" };

export default function Page() {
  return (
    <SignedInPage>
      <MissionsScreen />
    </SignedInPage>
  );
}
