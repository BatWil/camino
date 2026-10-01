import type { Metadata } from "next";
import { SignedInPage } from "@/components/layout/signed-in-page";
import { PlanDetailPage } from "@/features/plans/components/plan-detail-page";

export const metadata: Metadata = { title: "Plan" };

export default function Page() {
  return (
    <SignedInPage>
      <PlanDetailPage />
    </SignedInPage>
  );
}
