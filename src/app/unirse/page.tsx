import type { Metadata } from "next";
import { JoinChurchScreen } from "@/features/churches/components/join-church-screen";

export const metadata: Metadata = { title: "Unirme a mi iglesia" };

export default function UnirsePage() {
  return <JoinChurchScreen />;
}
