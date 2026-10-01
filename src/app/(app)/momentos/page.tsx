import type { Metadata } from "next";
import { MomentsScreen } from "@/features/moments/components/moments-screen";

export const metadata: Metadata = { title: "Momentos" };

export default function Page() {
  return <MomentsScreen />;
}
