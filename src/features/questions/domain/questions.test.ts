import { describe, expect, it } from "vitest";
import { anonymityNote, canSendQuestion, categoryLabel, QUESTION_CATEGORIES } from "./questions";

describe("questions", () => {
  it("uses the design chips", () => {
    expect(QUESTION_CATEGORIES.map((c) => c.label)).toEqual(["Fe", "Biblia", "Relaciones", "Dudas"]);
    expect(categoryLabel("other")).toBe("Otra");
  });

  it("explains what the leader sees", () => {
    expect(anonymityNote(true)).toMatch(/no verá tu nombre/);
    expect(anonymityNote(false)).toMatch(/verá tu nombre/);
  });

  it("requires a real question", () => {
    expect(canSendQuestion("hola")).toBe(false);
    expect(canSendQuestion("¿Dios me escucha?")).toBe(true);
  });
});
