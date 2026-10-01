import type { Metadata } from "next";
import { SignedInPage } from "@/components/layout/signed-in-page";
import { CheckinScreen } from "@/features/checkin/components/checkin-screen";

export const metadata: Metadata = { title: "Check-in" };

export default function Page() {
  return (
    <SignedInPage>
      <CheckinScreen />
    </SignedInPage>
  );
}
