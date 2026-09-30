/**
 * Product analytics event catalogue. Each event declares the ONLY properties it
 * may carry. Private content (journal text, prayer text, questions, check-in
 * notes) must never be added here — use ids, counts and categories instead.
 */
export interface AnalyticsEventMap {
  app_opened: { platform: "android" | "ios" | "pwa" | "browser" };
  onboarding_completed: { stage_key: string };
  devotional_started: { devotional_id: string };
  devotional_completed: { devotional_id: string };
  plan_started: { plan_id: string };
  plan_completed: { plan_id: string };
  prayer_created: { privacy: "PRIVATE" | "MENTOR" | "GROUP" | "CHURCH" };
  prayer_answered: Record<string, never>;
  journey_module_completed: { module_id: string; stage_key: string };
  event_registered: { event_id: string };
  service_interest: { opportunity_id: string };
  mentor_request: Record<string, never>;
  quick_action_opened: { action: string };
}

export type AnalyticsEventName = keyof AnalyticsEventMap;

export const ALLOWED_PROPERTIES: { [K in AnalyticsEventName]: ReadonlyArray<keyof AnalyticsEventMap[K] & string> } = {
  app_opened: ["platform"],
  onboarding_completed: ["stage_key"],
  devotional_started: ["devotional_id"],
  devotional_completed: ["devotional_id"],
  plan_started: ["plan_id"],
  plan_completed: ["plan_id"],
  prayer_created: ["privacy"],
  prayer_answered: [],
  journey_module_completed: ["module_id", "stage_key"],
  event_registered: ["event_id"],
  service_interest: ["opportunity_id"],
  mentor_request: [],
  quick_action_opened: ["action"],
};
