import type { Metadata } from "next";
import { SignedInPage } from "@/components/layout/signed-in-page";
import { ConferenceAgenda } from "@/features/conferences/components/conference-agenda";

export const metadata: Metadata = { title: "Mi agenda" };

export default function Page() {
  return (
    <SignedInPage>
      <ConferenceAgenda />
    </SignedInPage>
  );
}
