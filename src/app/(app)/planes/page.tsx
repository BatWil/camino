import type { Metadata } from "next";
import { PlanLibrary } from "@/features/plans/components/plan-library";

export const metadata: Metadata = { title: "Planes" };

export default function PlanesPage() {
  return <PlanLibrary />;
}
