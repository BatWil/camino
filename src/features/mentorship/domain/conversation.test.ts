import { describe, expect, it } from "vitest";
import { activityLabel, cleanMessage, dayLabel, groupByDay } from "./conversation";

const now = new Date(2026, 9, 1, 12); // Thu 1 Oct 2026 (local)

describe("conversation", () => {
  it("labels days", () => {
    expect(dayLabel(new Date(2026, 9, 1, 8).toISOString(), now)).toBe("HOY");
    expect(dayLabel(new Date(2026, 8, 30, 8).toISOString(), now)).toBe("AYER");
    expect(dayLabel(new Date(2026, 8, 29, 8).toISOString(), now)).toBe("MARTES");
  });

  it("groups consecutive messages by day", () => {
    const items = [
      { id: "1", created_at: new Date(2026, 8, 29, 8).toISOString() },
      { id: "2", created_at: new Date(2026, 8, 29, 9).toISOString() },
      { id: "3", created_at: new Date(2026, 9, 1, 9).toISOString() },
    ];
    expect(groupByDay(items, now).map((g) => [g.label, g.items.length])).toEqual([
      ["MARTES", 2],
      ["HOY", 1],
    ]);
  });

  it("shows only approximate activity", () => {
    expect(activityLabel("2026-09-28", now)).toEqual({ active: true, text: "Activo esta semana" });
    expect(activityLabel("2026-09-22", now)).toEqual({ active: false, text: "Hace 9 días" });
    expect(activityLabel(null, now).active).toBe(false);
  });

  it("cleans messages", () => {
    expect(cleanMessage("   ")).toBeNull();
    expect(cleanMessage("  hola  ")).toBe("hola");
    expect(cleanMessage("x".repeat(3000))).toHaveLength(2000);
  });
});
