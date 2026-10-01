import type { Metadata } from "next";
import { SignedInPage } from "@/components/layout/signed-in-page";
import { AskQuestionScreen } from "@/features/questions/components/ask-question-screen";

export const metadata: Metadata = { title: "Pregunta" };

export default function Page() {
  return (
    <SignedInPage>
      <AskQuestionScreen />
    </SignedInPage>
  );
}
