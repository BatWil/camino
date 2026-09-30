import type { Metadata } from "next";
import { WelcomeScreen } from "@/features/auth/components/welcome-screen";

export const metadata: Metadata = { title: "Bienvenida" };

export default function BienvenidaPage() {
  return <WelcomeScreen />;
}
