import type { Metadata } from "next";
import { SignedInPage } from "@/components/layout/signed-in-page";
import { CallingScreen } from "@/features/calling/components/calling-screen";

export const metadata: Metadata = { title: "Llamados" };

export default function Page() {
  return (
    <SignedInPage>
      <CallingScreen />
    </SignedInPage>
  );
}
