import { describe, expect, it } from "vitest";
import { activePercent, leaderChurchId, parseOverview, shortName } from "./leader";

describe("leader", () => {
  it("parses the overview", () => {
    const o = parseOverview({
      youth: 124,
      active_week: 89,
      in_plans: 38,
      want_serve: 12,
      conversations: 4,
      new_questions: 5,
    });
    expect(o.inPlans).toBe(38);
    expect(activePercent(o)).toBe(72);
    expect(activePercent(parseOverview(null))).toBe(0);
  });

  it("picks the church the person leads", () => {
    const access = {
      memberships: [],
      roles: [
        { role: "MENTOR" as const, churchId: "a" },
        { role: "LEADER" as const, churchId: "b" },
        { role: "PASTOR" as const, churchId: "c" },
      ],
    };
    expect(leaderChurchId(access, "c")).toBe("c");
    expect(leaderChurchId(access, "a")).toBe("b");
    expect(leaderChurchId({ memberships: [], roles: [{ role: "PLATFORM_ADMIN", churchId: null }] }, null)).toBeNull();
  });

  it("shortens names", () => {
    expect(shortName("Daniel Ramírez")).toBe("Daniel R.");
    expect(shortName("Sofía")).toBe("Sofía");
    expect(shortName(null)).toBe("Sin nombre");
  });
});
