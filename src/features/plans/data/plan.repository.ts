import type { PlanCategory, Tables } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";
import type { ActivePlan } from "@/features/today/domain/next-step";

export type Plan = Tables<"plans">;

export interface PlanDetail extends Plan {
  days: Array<{ dayNumber: number; devotional: { id: string; title: string; scriptureRef: string; minutes: number } }>;
}

export interface MyPlan extends ActivePlan {
  status: "active" | "completed" | "left";
  category: PlanCategory;
}

export const planRepository = {
  async list(): Promise<Plan[]> {
    const { data, error } = await requireSupabase().from("plans").select("*").eq("is_published", true).order("title");
    if (error) throw new AppError("unknown", "No pudimos cargar los planes.", error);
    return data;
  },

  async dayCounts(): Promise<Record<string, number>> {
    const { data, error } = await requireSupabase().from("plan_days").select("plan_id");
    if (error) throw new AppError("unknown", "No pudimos cargar los planes.", error);
    return data.reduce<Record<string, number>>((acc, d) => ({ ...acc, [d.plan_id]: (acc[d.plan_id] ?? 0) + 1 }), {});
  },

  async get(id: string): Promise<PlanDetail | null> {
    const { data, error } = await requireSupabase()
      .from("plans")
      .select("*, plan_days ( day_number, devotionals ( id, title, scripture_ref, minutes ) )")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new AppError("unknown", "No pudimos cargar el plan.", error);
    if (!data) return null;
    const { plan_days, ...plan } = data;
    return {
      ...plan,
      days: (plan_days ?? [])
        .filter((d) => d.devotionals)
        .sort((a, b) => a.day_number - b.day_number)
        .map((d) => ({
          dayNumber: d.day_number,
          devotional: {
            id: d.devotionals!.id,
            title: d.devotionals!.title,
            scriptureRef: d.devotionals!.scripture_ref,
            minutes: d.devotionals!.minutes,
          },
        })),
    };
  },

  /** My enrollments (active + completed) with their days and completions. */
  async mine(): Promise<MyPlan[]> {
    const sb = requireSupabase();
    const { data: enrollments, error } = await sb
      .from("user_plans")
      .select("id, plan_id, status, started_at, plans ( title, color, category )")
      .in("status", ["active", "completed"])
      .order("started_at", { ascending: false });
    if (error) throw new AppError("unknown", "No pudimos cargar tus planes.", error);
    if (!enrollments.length) return [];

    const ids = enrollments.map((e) => e.id);
    const planIds = [...new Set(enrollments.map((e) => e.plan_id))];
    const [completions, days] = await Promise.all([
      sb.from("plan_day_completions").select("user_plan_id, day_number").in("user_plan_id", ids),
      sb
        .from("plan_days")
        .select("plan_id, day_number, devotionals ( id, title, minutes, scripture_ref )")
        .in("plan_id", planIds),
    ]);
    if (completions.error || days.error) {
      throw new AppError("unknown", "No pudimos cargar tus planes.", completions.error ?? days.error);
    }

    return enrollments
      .filter((e) => e.plans)
      .map((e) => ({
        userPlanId: e.id,
        planId: e.plan_id,
        title: e.plans!.title,
        color: e.plans!.color,
        category: e.plans!.category,
        status: e.status,
        startedAt: e.started_at,
        completedDays: completions.data.filter((c) => c.user_plan_id === e.id).map((c) => c.day_number),
        days: days.data
          .filter((d) => d.plan_id === e.plan_id && d.devotionals)
          .map((d) => ({
            dayNumber: d.day_number,
            devotional: {
              id: d.devotionals!.id,
              title: d.devotionals!.title,
              minutes: d.devotionals!.minutes,
              scriptureRef: d.devotionals!.scripture_ref,
            },
          })),
      }));
  },

  async start(planId: string): Promise<string> {
    const { data, error } = await requireSupabase().rpc("start_plan", { p_plan_id: planId });
    if (error || !data) throw new AppError("unknown", "No pudimos empezar el plan.", error);
    return data;
  },
};
