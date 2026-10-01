import type { Metadata } from "next";
import { SavedScreen } from "@/features/bible/components/saved-screen";

export const metadata: Metadata = { title: "Guardados y resaltados" };

export default function Page() {
  return <SavedScreen />;
}
