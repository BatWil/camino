import type { Metadata } from "next";
import { MyQuestionsScreen } from "@/features/questions/components/my-questions-screen";

export const metadata: Metadata = { title: "Preguntas" };

export default function Page() {
  return <MyQuestionsScreen />;
}
