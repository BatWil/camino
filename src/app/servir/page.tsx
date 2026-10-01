import type { Metadata } from "next";
import { SignedInPage } from "@/components/layout/signed-in-page";
import { ServeScreen } from "@/features/service/components/serve-screen";

export const metadata: Metadata = { title: "Servir" };

export default function Page() {
  return (
    <SignedInPage>
      <ServeScreen />
    </SignedInPage>
  );
}
