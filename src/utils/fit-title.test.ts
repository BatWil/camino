import { describe, expect, it } from "vitest";
import { fitTitleStyle, wordWidthEm } from "./fit-title";

describe("fitTitleStyle", () => {
  it("estimates word widths like the real font (I narrow, M/W wide)", () => {
    expect(wordWidthEm("IIII")).toBeLessThan(wordWidthEm("MMMM") / 2);
    expect(wordWidthEm("Oración")).toBeCloseTo(wordWidthEm("ORACION"));
  });

  it("caps at the design size and scales by the widest word", () => {
    const style = fitTitleStyle("Construyendo constancia", 18);
    expect(style.fontSize).toMatch(/^min\(18px, calc\(100cqi \/ \d+\.\d{2}\)\)$/);
    const divisor = Number(/\/ ([\d.]+)\)/.exec(String(style.fontSize))![1]);
    expect(divisor).toBeCloseTo(wordWidthEm("CONSTRUYENDO") * 1.04, 1);
  });
});
