import { describe, expect, it } from "vitest";
import { BOOKS, bibleHref, formatReference, parseReference, stepChapter } from "./books";

describe("Bible books", () => {
  it("has the 66 books and 1189 chapters", () => {
    expect(BOOKS).toHaveLength(66);
    expect(BOOKS.reduce((n, b) => n + b.chapters, 0)).toBe(1189);
    expect(BOOKS.filter((b) => b.testament === "NT")).toHaveLength(27);
  });

  it("parses the references used by devotionals", () => {
    expect(parseReference("Juan 15:5")).toEqual({ book: "JHN", chapter: 15, verse: 5 });
    expect(parseReference("Salmo 13:1–2, 5")).toEqual({ book: "PSA", chapter: 13, verse: 1 });
    expect(parseReference("1 Pedro 5:7")).toEqual({ book: "1PE", chapter: 5, verse: 7 });
    expect(parseReference("Lamentaciones 3:22–23")).toEqual({ book: "LAM", chapter: 3, verse: 22 });
    expect(parseReference("genesis 1")).toEqual({ book: "GEN", chapter: 1, verse: undefined });
  });

  it("rejects unknown books and impossible chapters", () => {
    expect(parseReference("Hechos 29:1")).toBeNull();
    expect(parseReference("Libro inventado 1:1")).toBeNull();
    expect(parseReference("hola")).toBeNull();
  });

  it("formats, links and steps across books", () => {
    expect(formatReference({ book: "JHN", chapter: 15, verse: 5 })).toBe("Juan 15:5");
    expect(bibleHref({ book: "JHN", chapter: 15 })).toBe("/biblia/?libro=JHN&cap=15");
    expect(stepChapter({ book: "MAL", chapter: 4 }, 1)).toEqual({ book: "MAT", chapter: 1 });
    expect(stepChapter({ book: "MAT", chapter: 1 }, -1)).toEqual({ book: "MAL", chapter: 4 });
    expect(stepChapter({ book: "REV", chapter: 22 }, 1)).toBeNull();
  });
});
