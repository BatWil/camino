import { describe, expect, it } from "vitest";
import { answeredLabel, daysBetween, formatClock, stepForElapsed } from "./prayer";

describe("prayer helpers", () => {
  it("counts days and celebrates the answer kindly", () => {
    expect(daysBetween("2026-09-20T10:00:00Z", new Date("2026-10-02T09:00:00Z"))).toBe(11);
    expect(answeredLabel("2026-09-20T10:00:00Z", "2026-10-02T10:00:00Z")).toBe("✦ Dios respondió después de 12 días ✦");
    expect(answeredLabel("2026-10-02T08:00:00Z", "2026-10-02T09:00:00Z")).toBe("✦ Dios respondió hoy ✦");
  });

  it("splits a timed session across the five movements", () => {
    expect(stepForElapsed(0, 600, 0)).toBe(0);
    expect(stepForElapsed(130, 600, 0)).toBe(1);
    expect(stepForElapsed(599, 600, 0)).toBe(4);
    expect(stepForElapsed(10, 600, 3)).toBe(3); // skipping ahead is respected
  });

  it("lets 'Libre' advance only by hand", () => {
    expect(stepForElapsed(9999, null, 2)).toBe(2);
  });

  it("formats the clock like 07:42", () => {
    expect(formatClock(462)).toBe("07:42");
  });
});
