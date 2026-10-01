import type { Metadata } from "next";
import { SignedInPage } from "@/components/layout/signed-in-page";
import { QuizScreen } from "@/features/quiz/components/quiz-screen";

export const metadata: Metadata = { title: "Quiz Bíblico" };

export default function Page() {
  return (
    <SignedInPage>
      <QuizScreen />
    </SignedInPage>
  );
}
