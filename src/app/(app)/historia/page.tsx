import type { Metadata } from "next";
import { StoryScreen } from "@/features/story/components/story-screen";

export const metadata: Metadata = { title: "Mi historia" };

export default function Page() {
  return <StoryScreen />;
}
