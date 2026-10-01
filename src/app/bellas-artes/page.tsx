import type { Metadata } from "next";
import { SignedInPage } from "@/components/layout/signed-in-page";
import { FineArtsScreen } from "@/features/fine-arts/components/fine-arts-screen";

export const metadata: Metadata = { title: "Bellas Artes" };

export default function Page() {
  return (
    <SignedInPage>
      <FineArtsScreen />
    </SignedInPage>
  );
}
