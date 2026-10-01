import { describe, expect, it } from "vitest";
import { groupByYear } from "@/features/moments/domain/moments";
import { relativeSince, storyLines } from "./story";

const now = new Date("2026-10-02T12:00:00Z");

describe("Mi historia", () => {
  it("speaks of time in human terms", () => {
    expect(relativeSince("2026-10-02T08:00:00Z", now)).toBe("hoy");
    expect(relativeSince("2026-09-29T08:00:00Z", now)).toBe("hace 3 días");
    expect(relativeSince("2026-04-01T08:00:00Z", now)).toBe("hace 6 meses");
    expect(relativeSince("2025-09-01T08:00:00Z", now)).toBe("hace 1 año");
  });

  it("tells a story with only what happened, no scoreboard", () => {
    const lines = storyLines({
      activeDays: 1,
      journalEntries: 0,
      firstJournalAt: null,
      answeredPrayers: 3,
      prayerMinutes: 0,
      plansCompleted: 2,
      devotionalsCompleted: 12,
      startedAt: null,
    });
    expect(lines).toEqual([
      "Apartaste tiempo para Dios 1 día.",
      "Recorriste 12 devocionales.",
      "Terminaste 2 planes.",
      "Viste 3 oraciones respondidas.",
    ]);
    expect(lines.join(" ")).not.toMatch(/ranking|puesto|más que/i);
  });

  it("groups moments by year, newest first", () => {
    const g = groupByYear([
      { happened_on: "2025-12-01" },
      { happened_on: "2026-03-01" },
      { happened_on: "2026-08-01" },
    ]);
    expect(g.map((y) => y.year)).toEqual([2026, 2025]);
    expect(g[0].items[0].happened_on).toBe("2026-08-01");
  });
});
