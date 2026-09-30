"use client";

import { firstName } from "@/features/profile/domain/profile";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useCurrentChurch } from "@/features/churches/hooks/use-access";

export function PanelGreeting() {
  const profile = useProfile();
  const { church } = useCurrentChurch();
  const name = firstName(profile.data);
  return (
    <div className="flex flex-col gap-1.5">
      {church ? <span className="text-sm text-ink/55">{church.churchName}</span> : null}
      <h1 className="m-0 font-display-x text-[40px] leading-[.9] tracking-[-.02em]">Hola{name ? `, ${name}` : ""}</h1>
    </div>
  );
}
