import type { Metadata } from "next";
import { PrayerPlace } from "@/features/prayer/components/prayer-place";

export const metadata: Metadata = { title: "Mi lugar de oración" };

export default function Page() {
  return <PrayerPlace />;
}
