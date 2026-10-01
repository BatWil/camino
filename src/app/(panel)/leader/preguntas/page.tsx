import type { Metadata } from "next";
import { LeaderQuestions } from "@/features/leader/components/leader-questions";

export const metadata: Metadata = { title: "Preguntas · Panel de líder" };

export default function Page() {
  return <LeaderQuestions />;
}
