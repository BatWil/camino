import type { Metadata } from "next";
import { LeaderSeries } from "@/features/leader/components/leader-series";

export const metadata: Metadata = { title: "Series · Panel de líder" };

export default function Page() {
  return <LeaderSeries />;
}
