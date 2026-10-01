"use client";

import { useSearchParams } from "next/navigation";
import { DevotionalScreen } from "./devotional-screen";

export function DevotionalPage() {
  const params = useSearchParams();
  return (
    <DevotionalScreen
      key={`${params.get("id")}-${params.get("plan")}`}
      id={params.get("id")}
      userPlanId={params.get("plan")}
    />
  );
}
