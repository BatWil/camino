import type { Metadata } from "next";
import { PreferencesScreen } from "@/features/profile/components/preferences-screen";

export const metadata: Metadata = { title: "Mi foto e intereses" };

export default function PreferenciasPage() {
  return <PreferencesScreen />;
}
