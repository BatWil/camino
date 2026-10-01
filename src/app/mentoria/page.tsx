import type { Metadata } from "next";
import { SignedInPage } from "@/components/layout/signed-in-page";
import { MentorshipScreen } from "@/features/mentorship/components/mentorship-screen";

export const metadata: Metadata = { title: "Mentoría" };

export default function Page() {
  return (
    <SignedInPage>
      <MentorshipScreen />
    </SignedInPage>
  );
}
