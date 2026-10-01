import type { Metadata } from "next";
import { LeaderService } from "@/features/leader/components/leader-service";

export const metadata: Metadata = { title: "Servicio · Panel de líder" };

export default function Page() {
  return <LeaderService />;
}
