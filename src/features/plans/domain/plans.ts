import type { PlanCategory } from "@/lib/supabase/database.types";

export const CATEGORY_LABEL: Record<PlanCategory, string> = {
  daily_life: "Vida diaria",
  foundations: "Fundamentos",
  leadership: "Liderazgo",
};

const LIGHT_TEXT = new Set(["#9B6BFF", "#3D8BFF", "#FF4D5E", "#0D0A26"]);

/** Text colour used on a plan card colour, as in screens 5b/5c. */
export function onPlanColor(color: string): string {
  return LIGHT_TEXT.has(color.toUpperCase()) ? "#FFFFFF" : "#0D0A26";
}

export function normalizeSearch(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function matchesSearch(plan: { title: string; summary: string }, query: string): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  return normalizeSearch(`${plan.title} ${plan.summary}`).includes(q);
}

export type LibraryTab = "for_you" | "church" | PlanCategory;

/**
 * "Para ti": plans recommended for the current stage or sharing an interest
 * chosen in onboarding. Other tabs filter by church or category.
 */
export function filterPlans<
  T extends { source: string; category: PlanCategory; recommended_stage_id: string | null; growth_areas: string[] },
>(plans: T[], tab: LibraryTab, ctx: { stageId: string | null; interests: string[] }): T[] {
  switch (tab) {
    case "for_you":
      return plans.filter(
        (p) =>
          (ctx.stageId && p.recommended_stage_id === ctx.stageId) ||
          p.growth_areas.some((g) => ctx.interests.includes(g)),
      );
    case "church":
      return plans.filter((p) => p.source === "CHURCH");
    default:
      return plans.filter((p) => p.category === tab);
  }
}
