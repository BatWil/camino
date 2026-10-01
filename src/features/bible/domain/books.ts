/** The 66 books (USFM codes), Spanish names and chapter counts. */
export interface BibleBook {
  code: string;
  name: string;
  chapters: number;
  testament: "AT" | "NT";
}

const RAW: Array<[string, string, number]> = [
  ["GEN", "Génesis", 50],
  ["EXO", "Éxodo", 40],
  ["LEV", "Levítico", 27],
  ["NUM", "Números", 36],
  ["DEU", "Deuteronomio", 34],
  ["JOS", "Josué", 24],
  ["JDG", "Jueces", 21],
  ["RUT", "Rut", 4],
  ["1SA", "1 Samuel", 31],
  ["2SA", "2 Samuel", 24],
  ["1KI", "1 Reyes", 22],
  ["2KI", "2 Reyes", 25],
  ["1CH", "1 Crónicas", 29],
  ["2CH", "2 Crónicas", 36],
  ["EZR", "Esdras", 10],
  ["NEH", "Nehemías", 13],
  ["EST", "Ester", 10],
  ["JOB", "Job", 42],
  ["PSA", "Salmos", 150],
  ["PRO", "Proverbios", 31],
  ["ECC", "Eclesiastés", 12],
  ["SNG", "Cantares", 8],
  ["ISA", "Isaías", 66],
  ["JER", "Jeremías", 52],
  ["LAM", "Lamentaciones", 5],
  ["EZK", "Ezequiel", 48],
  ["DAN", "Daniel", 12],
  ["HOS", "Oseas", 14],
  ["JOL", "Joel", 3],
  ["AMO", "Amós", 9],
  ["OBA", "Abdías", 1],
  ["JON", "Jonás", 4],
  ["MIC", "Miqueas", 7],
  ["NAM", "Nahúm", 3],
  ["HAB", "Habacuc", 3],
  ["ZEP", "Sofonías", 3],
  ["HAG", "Hageo", 2],
  ["ZEC", "Zacarías", 14],
  ["MAL", "Malaquías", 4],
  ["MAT", "Mateo", 28],
  ["MRK", "Marcos", 16],
  ["LUK", "Lucas", 24],
  ["JHN", "Juan", 21],
  ["ACT", "Hechos", 28],
  ["ROM", "Romanos", 16],
  ["1CO", "1 Corintios", 16],
  ["2CO", "2 Corintios", 13],
  ["GAL", "Gálatas", 6],
  ["EPH", "Efesios", 6],
  ["PHP", "Filipenses", 4],
  ["COL", "Colosenses", 4],
  ["1TH", "1 Tesalonicenses", 5],
  ["2TH", "2 Tesalonicenses", 3],
  ["1TI", "1 Timoteo", 6],
  ["2TI", "2 Timoteo", 4],
  ["TIT", "Tito", 3],
  ["PHM", "Filemón", 1],
  ["HEB", "Hebreos", 13],
  ["JAS", "Santiago", 5],
  ["1PE", "1 Pedro", 5],
  ["2PE", "2 Pedro", 3],
  ["1JN", "1 Juan", 5],
  ["2JN", "2 Juan", 1],
  ["3JN", "3 Juan", 1],
  ["JUD", "Judas", 1],
  ["REV", "Apocalipsis", 22],
];

export const BOOKS: readonly BibleBook[] = RAW.map(([code, name, chapters], i) => ({
  code,
  name,
  chapters,
  testament: i < 39 ? "AT" : "NT",
}));

const BY_CODE = new Map(BOOKS.map((b) => [b.code, b]));

export function bookByCode(code: string): BibleBook | undefined {
  return BY_CODE.get(code);
}

function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

const ALIASES: Record<string, string> = {
  salmo: "PSA",
  "cantar de los cantares": "SNG",
  "el cantar de los cantares": "SNG",
  apoc: "REV",
};

const BY_NAME = new Map<string, string>([
  ...BOOKS.map((b) => [norm(b.name), b.code] as [string, string]),
  ...Object.entries(ALIASES),
]);

export interface BibleRef {
  book: string;
  chapter: number;
  verse?: number;
}

/** "Juan 15:5", "Salmo 13:1–2, 5", "1 Pedro 5:7", "Rut 2" → reference (first verse only). */
export function parseReference(text: string): BibleRef | null {
  const m = /^\s*(.+?)\s+(\d{1,3})(?::(\d{1,3}))?/.exec(text);
  if (!m) return null;
  const code = BY_NAME.get(norm(m[1]));
  if (!code) return null;
  const book = BY_CODE.get(code)!;
  const chapter = Number(m[2]);
  if (chapter < 1 || chapter > book.chapters) return null;
  return { book: code, chapter, verse: m[3] ? Number(m[3]) : undefined };
}

export function formatReference(ref: BibleRef): string {
  const name = bookByCode(ref.book)?.name ?? ref.book;
  return ref.verse ? `${name} ${ref.chapter}:${ref.verse}` : `${name} ${ref.chapter}`;
}

export function bibleHref(ref: BibleRef): string {
  return `/biblia/?libro=${ref.book}&cap=${ref.chapter}${ref.verse ? `&v=${ref.verse}` : ""}`;
}

/** Previous/next chapter across book boundaries. */
export function stepChapter(ref: BibleRef, delta: 1 | -1): BibleRef | null {
  const i = BOOKS.findIndex((b) => b.code === ref.book);
  if (i < 0) return null;
  const chapter = ref.chapter + delta;
  if (chapter >= 1 && chapter <= BOOKS[i].chapters) return { book: ref.book, chapter };
  const next = BOOKS[i + delta];
  if (!next) return null;
  return { book: next.code, chapter: delta === 1 ? 1 : next.chapters };
}
