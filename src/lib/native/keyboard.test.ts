import { describe, expect, it } from "vitest";
import { fieldIsHidden } from "./keyboard";

describe("keyboard helpers", () => {
  it("detects a field covered by the keyboard or above the view", () => {
    // Visible area 0–400 (keyboard took the rest)
    expect(fieldIsHidden({ top: 100, bottom: 150 }, 0, 400)).toBe(false);
    expect(fieldIsHidden({ top: 520, bottom: 570 }, 0, 400)).toBe(true);
    expect(fieldIsHidden({ top: -40, bottom: 10 }, 0, 400)).toBe(true);
  });
});
