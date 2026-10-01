import type { Metadata } from "next";
import { SignedInPage } from "@/components/layout/signed-in-page";
import { DevotionalPage } from "@/features/devotionals/components/devotional-page";

export const metadata: Metadata = { title: "Devocional" };

export default function Page() {
  return (
    <SignedInPage>
      <DevotionalPage />
    </SignedInPage>
  );
}
