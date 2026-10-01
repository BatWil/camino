import type { Metadata } from "next";
import { LeaderEvents } from "@/features/leader/components/leader-events";

export const metadata: Metadata = { title: "Eventos · Panel de líder" };

export default function Page() {
  return <LeaderEvents />;
}
