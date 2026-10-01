import type { Metadata } from "next";
import { MinistriesHub } from "@/features/ministries/components/ministries-hub";

export const metadata: Metadata = { title: "Ministerios" };

export default function Page() {
  return <MinistriesHub />;
}
