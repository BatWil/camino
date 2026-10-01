import type { Metadata } from "next";
import { JournalScreen } from "@/features/journal/components/journal-screen";

export const metadata: Metadata = { title: "Mi diario" };

export default function Page() {
  return <JournalScreen />;
}
