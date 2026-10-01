import type { Metadata } from "next";
import { ResourcesScreen } from "@/features/resources/components/resources-screen";

export const metadata: Metadata = { title: "Recursos" };

export default function Page() {
  return <ResourcesScreen />;
}
