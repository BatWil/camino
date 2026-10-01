import { describe, expect, it } from "vitest";
import { challengeMessage, challengeSlots } from "./slots";

describe("challenge slots (6a)", () => {
  it("shows done days, then today's slot, then empty ones", () => {
    const slots = challengeSlots(["2026-09-28", "2026-09-29"], 5, "2026-10-01");
    expect(slots.map((s) => s.kind)).toEqual(["done", "done", "today", "empty", "empty"]);
    expect(slots.map((s) => s.label).slice(0, 3)).toEqual(["LUN", "MAR", "JUE"]);
  });

  it("lets you undo only today", () => {
    const slots = challengeSlots(["2026-09-28", "2026-10-01"], 5, "2026-10-01");
    expect(slots[0]).toMatchObject({ kind: "done", undoable: false });
    expect(slots[1]).toMatchObject({ kind: "done", undoable: true });
    expect(slots.some((s) => s.kind === "today")).toBe(false);
  });

  it("encourages without pressure", () => {
    expect(challengeMessage(0, 5)).toBe("hoy puedes empezar ✦");
    expect(challengeMessage(3, 5)).toBe("3 de 5 · ¡vas muy bien!");
    expect(challengeMessage(5, 5)).toBe("¡reto completado! ✦");
  });
});
