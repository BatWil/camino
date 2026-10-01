import { describe, expect, it } from "vitest";
import { computeRhythm, localIsoDate, weekStart } from "./rhythm";

const today = new Date(2026, 9, 2, 10); // Fri 2 Oct 2026

describe("Tu ritmo", () => {
  it("shows the last 7 days ending today", () => {
    const r = computeRhythm([], today);
    expect(r.days).toHaveLength(7);
    expect(r.days[6]).toEqual({ date: "2026-10-02", active: false, isToday: true });
    expect(r.days[0].date).toBe("2026-09-26");
  });

  it("counts days with time for God and speaks kindly", () => {
    const r = computeRhythm(["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02"], today);
    expect(r.activeCount).toBe(5);
    expect(r.message).toBe("Esta semana apartaste tiempo 5 días.");
  });

  it("never blames: an empty week invites to take a step", () => {
    const r = computeRhythm(["2026-08-01"], today);
    expect(r.activeCount).toBe(0);
    expect(r.message).toBe("Hoy también puedes dar un paso.");
    expect(r.message).not.toMatch(/perdiste|fallaste|racha/i);
  });

  it("after a pause, reminds that you can always come back", () => {
    expect(computeRhythm(["2026-09-26"], today).message).toMatch(/Siempre puedes volver/);
  });

  it("weeks start on Monday", () => {
    expect(localIsoDate(weekStart(today))).toBe("2026-09-28");
    expect(localIsoDate(weekStart(new Date(2026, 9, 4)))).toBe("2026-09-28"); // Sunday
  });
});
