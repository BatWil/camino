import type { Tables } from "@/lib/supabase/database.types";

export type Profile = Tables<"profiles">;

/** First name used in greetings ("BUENOS DÍAS, DANIEL"). */
export function firstName(profile: Pick<Profile, "display_name"> | null | undefined): string | null {
  const name = profile?.display_name?.trim();
  if (!name) return null;
  return name.split(/\s+/)[0] ?? null;
}

export function hasCompletedOnboarding(profile: Pick<Profile, "onboarding_completed_at"> | null | undefined): boolean {
  return Boolean(profile?.onboarding_completed_at);
}
