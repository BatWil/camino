/**
 * Parser for eBible.org "VPL" (verse per line) files:
 *   GEN 1:1 En el principio crió Dios los cielos y la tierra.
 * Returns { [BOOK]: { [chapter]: [[verse, text], ...] } } for canonical books only.
 */
export const CANONICAL = [
  "GEN",
  "EXO",
  "LEV",
  "NUM",
  "DEU",
  "JOS",
  "JDG",
  "RUT",
  "1SA",
  "2SA",
  "1KI",
  "2KI",
  "1CH",
  "2CH",
  "EZR",
  "NEH",
  "EST",
  "JOB",
  "PSA",
  "PRO",
  "ECC",
  "SNG",
  "ISA",
  "JER",
  "LAM",
  "EZK",
  "DAN",
  "HOS",
  "JOL",
  "AMO",
  "OBA",
  "JON",
  "MIC",
  "NAM",
  "HAB",
  "ZEP",
  "HAG",
  "ZEC",
  "MAL",
  "MAT",
  "MRK",
  "LUK",
  "JHN",
  "ACT",
  "ROM",
  "1CO",
  "2CO",
  "GAL",
  "EPH",
  "PHP",
  "COL",
  "1TH",
  "2TH",
  "1TI",
  "2TI",
  "TIT",
  "PHM",
  "HEB",
  "JAS",
  "1PE",
  "2PE",
  "1JN",
  "2JN",
  "3JN",
  "JUD",
  "REV",
];
const CANON = new Set(CANONICAL);
const LINE = /^([1-4A-Z][A-Z0-9]{2}) (\d{1,3}):(\d{1,3}) (.*)$/;

/** @param {string} text */
export function cleanVerse(text) {
  return text
    .replace(/¶/g, "")
    .replace(/\[[^\]]*\]/g, (m) => m.slice(1, -1)) // keep bracketed (italic-supplied) words, drop brackets
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {string} source
 * @returns {Record<string, Record<number, Array<[number, string]>>>}
 */
export function parseVpl(source) {
  /** @type {Record<string, Record<number, Array<[number, string]>>>} */
  const books = {};
  for (const raw of source.split(/\r?\n/)) {
    const m = LINE.exec(raw.replace(/^﻿/, "").trim());
    if (!m) continue;
    const [, code, ch, v, text] = m;
    if (!CANON.has(code)) continue;
    const verse = cleanVerse(text);
    if (!verse) continue;
    const chapters = (books[code] ??= {});
    (chapters[Number(ch)] ??= []).push([Number(v), verse]);
  }
  return books;
}

/** Converts parsed books into the app's file format: chapters as an ordered array. */
/**
 * @param {string} code
 * @param {Record<number, Array<[number, string]>>} chapters
 */
export function toBookFile(code, chapters) {
  const numbers = Object.keys(chapters)
    .map(Number)
    .sort((a, b) => a - b);
  const max = numbers[numbers.length - 1] ?? 0;
  return {
    code,
    chapters: Array.from({ length: max }, (_, i) => (chapters[i + 1] ?? []).sort((a, b) => a[0] - b[0])),
  };
}
