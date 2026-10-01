import { describe, expect, it } from "vitest";
import { DAILY_PROMPTS, dayLabel, promptFor, timeLabel } from "./journal";

describe("journal helpers", () => {
  const today = new Date(2026, 9, 2, 12); // Fri 2 Oct
  it("labels days like the design", () => {
    expect(dayLabel("2026-10-02", today)).toBe("HOY");
    expect(dayLabel("2026-10-01", today)).toBe("AYER");
    expect(dayLabel("2026-09-27", today)).toBe("DOM 27");
  });

  it("rotates the daily prompt and keeps it stable within a day", () => {
    expect(DAILY_PROMPTS).toContain(promptFor(today));
    expect(promptFor(new Date(2026, 9, 2, 23))).toBe(promptFor(today));
    expect(promptFor(new Date(2026, 9, 3))).not.toBe(promptFor(today));
  });

  it("formats times as H:MM", () => {
    expect(timeLabel(new Date(2026, 9, 2, 7, 5).toISOString())).toBe("7:05");
  });
});
