import { describe, expect, it } from "vitest";
import { buildRound, clock, feedback, finishMessage, shuffle } from "./quiz";

const q = (id: string, answer = 1) => ({
  id,
  question: "¿?",
  options: ["a", "b", "c", "d"],
  answer_index: answer,
  verse_ref: null,
  chapter: 8,
});

describe("quiz", () => {
  it("shuffles deterministically and keeps every item", () => {
    const items = [1, 2, 3, 4, 5, 6];
    expect(shuffle(items, 42)).toEqual(shuffle(items, 42));
    expect([...shuffle(items, 42)].sort()).toEqual(items);
  });

  it("builds a round of at most N questions", () => {
    const all = Array.from({ length: 30 }, (_, i) => q(String(i)));
    expect(buildRound(all, 20, 7)).toHaveLength(20);
    expect(buildRound(all.slice(0, 5), 20, 7)).toHaveLength(5);
  });

  it("gives kind feedback without points", () => {
    expect(feedback(q("x"), 1)).toEqual({ correct: true, text: "¡correcto! ✦" });
    expect(feedback(q("x"), 0).text).toBe("casi… es la B. ¡sigue!");
  });

  it("formats the clock and the finish message", () => {
    expect(clock(18)).toBe("0:18");
    expect(clock(125)).toBe("2:05");
    expect(finishMessage(20, 20)).toMatch(/Perfecto/);
    expect(finishMessage(2, 20)).toMatch(/Buen comienzo/);
  });
});
