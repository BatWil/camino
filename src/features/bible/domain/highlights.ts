import type { HighlightColor } from "../data/bible-user.repository";

/** Highlight colours from screen 5a. */
export const HIGHLIGHTS: ReadonlyArray<{ color: HighlightColor; hex: string; label: string }> = [
  { color: "yellow", hex: "#FFE58A", label: "Amarillo" },
  { color: "green", hex: "#BFF0D3", label: "Verde" },
  { color: "blue", hex: "#CFE0FF", label: "Azul" },
  { color: "violet", hex: "#E3D8FF", label: "Violeta" },
];

export const SELECTED_BG = "rgba(61,139,255,.15)";

export function highlightHex(color: HighlightColor | undefined): string | undefined {
  return HIGHLIGHTS.find((h) => h.color === color)?.hex;
}
