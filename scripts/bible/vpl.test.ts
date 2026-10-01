import { describe, expect, it } from "vitest";
import { parseVpl, toBookFile } from "./vpl.mjs";

const SAMPLE = [
  "﻿GEN 1:1 En el principio crió Dios los cielos y la tierra.",
  "GEN 1:2 Y la tierra estaba desordenada ¶ y vacía.",
  "JHN 15:2 Segundo [versículo].",
  "JHN 15:1 Primero.",
  "TOB 1:1 Libro deuterocanónico ignorado.",
  "basura sin formato",
].join("\r\n");

describe("VPL import", () => {
  it("parses canonical verses, cleans markers and ignores other books", () => {
    const books = parseVpl(SAMPLE);
    expect(Object.keys(books).sort()).toEqual(["GEN", "JHN"]);
    expect(books.GEN[1]).toEqual([
      [1, "En el principio crió Dios los cielos y la tierra."],
      [2, "Y la tierra estaba desordenada y vacía."],
    ]);
    expect(books.JHN[15][0]).toEqual([2, "Segundo versículo."]);
  });

  it("writes ordered chapters, keeping gaps empty", () => {
    const file = toBookFile("JHN", parseVpl(SAMPLE).JHN);
    expect(file.chapters).toHaveLength(15);
    expect(file.chapters[13]).toEqual([]);
    expect(file.chapters[14].map((v: [number, string]) => v[0])).toEqual([1, 2]);
  });
});
