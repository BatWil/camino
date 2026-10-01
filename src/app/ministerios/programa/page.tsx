import type { Metadata } from "next";
import { SignedInPage } from "@/components/layout/signed-in-page";
import { ProgramScreen } from "@/features/ministries/components/program-screen";

export const metadata: Metadata = { title: "Ministerio" };

export default function Page() {
  return (
    <SignedInPage>
      <ProgramScreen />
    </SignedInPage>
  );
}
