import type { Metadata } from "next";
import { SignedInPage } from "@/components/layout/signed-in-page";
import { EventDetail } from "@/features/events/components/event-detail";

export const metadata: Metadata = { title: "Evento" };

export default function Page() {
  return (
    <SignedInPage enter={false}>
      <EventDetail />
    </SignedInPage>
  );
}
