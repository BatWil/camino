import type { Metadata } from "next";
import { LeaderYouth } from "@/features/leader/components/leader-youth";

export const metadata: Metadata = { title: "Jóvenes · Panel de líder" };

export default function Page() {
  return <LeaderYouth />;
}
