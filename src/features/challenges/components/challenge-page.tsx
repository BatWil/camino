"use client";

import { useSearchParams } from "next/navigation";
import { ChallengeScreen } from "./challenge-screen";

export function ChallengePage() {
  const params = useSearchParams();
  return <ChallengeScreen id={params.get("id")} />;
}
