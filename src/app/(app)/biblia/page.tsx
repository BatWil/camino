import { Suspense } from "react";
import type { Metadata } from "next";
import { ScreenSkeleton } from "@/components/ui/skeleton";
import { BiblePage } from "@/features/bible/components/bible-page";

export const metadata: Metadata = { title: "Biblia" };

export default function Page() {
  return (
    <Suspense fallback={<ScreenSkeleton />}>
      <BiblePage />
    </Suspense>
  );
}
