import type { Metadata } from "next";
import { NoticesScreen } from "@/features/notifications/components/notices-screen";

export const metadata: Metadata = { title: "Avisos" };

export default function Page() {
  return <NoticesScreen />;
}
