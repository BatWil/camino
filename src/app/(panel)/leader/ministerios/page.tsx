import type { Metadata } from "next";
import { LeaderMinistries } from "@/features/leader/components/leader-ministries";

export const metadata: Metadata = { title: "Ministerios · Panel de líder" };

export default function Page() {
  return <LeaderMinistries />;
}
