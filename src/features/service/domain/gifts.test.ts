import { describe, expect, it } from "vitest";
import { GIFT_STATEMENTS, parseScores, rankOpportunities, scoreGifts, topGifts } from "./gifts";

describe("gifts", () => {
  it("scores 0–100 per area", () => {
    const all5 = Object.fromEntries(GIFT_STATEMENTS.map((s) => [s.id, 5]));
    expect(scoreGifts(all5).teaching).toBe(100);
    expect(scoreGifts({}).teaching).toBe(0);
    expect(scoreGifts({ t1: 5, t2: 1 }).teaching).toBe(50);
  });

  it("clamps out-of-range answers", () => {
    expect(scoreGifts({ t1: 99, t2: 99 }).teaching).toBe(100);
    expect(scoreGifts({ t1: -3, t2: -3 }).teaching).toBe(0);
  });

  it("picks the strongest areas and ignores zeros", () => {
    const top = topGifts({ teaching: 86, service: 74, creativity: 61, music: 0 }, 3);
    expect(top.map((g) => g.area)).toEqual(["teaching", "service", "creativity"]);
    expect(topGifts({}, 3)).toEqual([]);
  });

  it("ranks opportunities by fit without dropping any", () => {
    const items = [
      { id: "a", area: "care" as const },
      { id: "b", area: "tech" as const },
    ];
    expect(rankOpportunities(items, { tech: 90, care: 10 }).map((i) => i.id)).toEqual(["b", "a"]);
    expect(rankOpportunities(items, null).map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("parses stored scores defensively", () => {
    expect(parseScores({ teaching: 120, foo: 3, service: "x" })).toEqual({ teaching: 100 });
    expect(parseScores(null)).toBeNull();
    expect(parseScores([1])).toBeNull();
  });
});
