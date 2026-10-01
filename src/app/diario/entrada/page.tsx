import type { Metadata } from "next";
import { SignedInPage } from "@/components/layout/signed-in-page";
import { JournalEditorPage } from "@/features/journal/components/journal-editor-page";

export const metadata: Metadata = { title: "Mi diario" };

export default function Page() {
  return (
    <SignedInPage>
      <JournalEditorPage />
    </SignedInPage>
  );
}
