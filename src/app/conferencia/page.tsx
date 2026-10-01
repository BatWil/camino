import type { Metadata } from "next";
import { SignedInPage } from "@/components/layout/signed-in-page";
import { ConferenceDetail } from "@/features/conferences/components/conference-detail";

export const metadata: Metadata = { title: "Conferencia" };

export default function Page() {
  return (
    <SignedInPage>
      <ConferenceDetail />
    </SignedInPage>
  );
}
