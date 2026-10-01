import type { Metadata } from "next";
import { LeaderDashboard } from "@/features/leader/components/leader-dashboard";

export const metadata: Metadata = { title: "Panel de líder" };

export default function LeaderDashboardPage() {
  return <LeaderDashboard />;
}
