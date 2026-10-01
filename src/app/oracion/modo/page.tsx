import type { Metadata } from "next";
import { SignedInPage } from "@/components/layout/signed-in-page";
import { PrayerModePage } from "@/features/prayer/components/prayer-pages";

export const metadata: Metadata = { title: "Modo oración" };

export default function Page() {
  return (
    <SignedInPage>
      <PrayerModePage />
    </SignedInPage>
  );
}
