import type { CSSProperties } from "react";

/**
 * Advance widths (em) of Archivo Expanded 900 uppercase, measured in Chromium:
 * typical letters ≈ 0.88–0.97, I ≈ 0.40, M/W ≈ 1.2. Unknown glyphs use the default.
 */
const WIDTH: Record<string, number> = {
  I: 0.42,
  J: 0.8,
  L: 0.86,
  M: 1.22,
  W: 1.26,
  "¿": 0.6,
  "?": 0.75,
  ".": 0.35,
  ",": 0.35,
};
const DEFAULT_WIDTH = 0.98;
const SAFETY = 1.04;

export function wordWidthEm(word: string): number {
  return [...word.toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "")].reduce(
    (sum, ch) => sum + (WIDTH[ch] ?? DEFAULT_WIDTH),
    0,
  );
}

/**
 * Poster titles (Archivo 125%, uppercase) must never split a word. Scales the font
 * down only as much as needed so the widest word fits the container width.
 * The element's parent must be an inline-size container (`@container`).
 */
export function fitTitleStyle(text: string, maxPx: number): CSSProperties {
  const widest = Math.max(1, ...text.split(/\s+/).filter(Boolean).map(wordWidthEm)) * SAFETY;
  return { fontSize: `min(${maxPx}px, calc(100cqi / ${widest.toFixed(2)}))` };
}
