import type { Metadata } from "next";
import { SignedInPage } from "@/components/layout/signed-in-page";
import { PrayerEditorPage } from "@/features/prayer/components/prayer-pages";

export const metadata: Metadata = { title: "Petición" };

export default function Page() {
  return (
    <SignedInPage>
      <PrayerEditorPage />
    </SignedInPage>
  );
}
