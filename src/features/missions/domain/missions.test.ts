import { describe, expect, it } from "vitest";
import { money, parseAmount, progressPercent } from "./missions";

describe("missions", () => {
  it("computes progress safely", () => {
    expect(progressPercent(38400, 60000)).toBe(64);
    expect(progressPercent(90000, 60000)).toBe(100);
    expect(progressPercent(10, 0)).toBe(0);
  });

  it("parses custom amounts", () => {
    expect(parseAmount("$1,250.50")).toBe(1250.5);
    expect(parseAmount("0")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("99999999")).toBeNull();
  });

  it("formats money", () => {
    expect(money(38400, "MXN")).toMatch(/38,400/);
  });
});
