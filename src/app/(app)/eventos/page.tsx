import type { Metadata } from "next";
import { EventsScreen } from "@/features/events/components/events-screen";

export const metadata: Metadata = { title: "Eventos" };

export default function Page() {
  return <EventsScreen />;
}
