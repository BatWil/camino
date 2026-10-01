import type { Metadata } from "next";
import { NoticePreferences } from "@/features/notifications/components/notice-preferences";

export const metadata: Metadata = { title: "Avisos y recordatorios" };

export default function Page() {
  return <NoticePreferences />;
}
