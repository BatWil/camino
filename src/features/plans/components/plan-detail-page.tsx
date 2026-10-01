"use client";

import { useSearchParams } from "next/navigation";
import { PlanDetail } from "./plan-detail";

export function PlanDetailPage() {
  const params = useSearchParams();
  return <PlanDetail id={params.get("id")} />;
}
