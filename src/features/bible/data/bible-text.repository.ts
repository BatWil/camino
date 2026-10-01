import { AppError } from "@/types/result";

/**
 * Bible text provider. Texts are static files under /bible/<version>/ produced by
 * `npm run bible:install` (public domain), so reading works offline and inside the
 * native apps. A licensed online provider can implement the same interface later.
 */
export interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  license: string;
}

export type Verse = [number, string];

export interface BibleTextProvider {
  versions(): Promise<BibleVersion[]>;
  chapter(version: string, book: string, chapter: number): Promise<Verse[]>;
}

const bookCache = new Map<string, Promise<{ code: string; chapters: Verse[][] }>>();

async function getJson<T>(url: string): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new AppError("offline", "No pudimos cargar este texto sin conexión.", err);
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new AppError("unknown", "No pudimos cargar el texto bíblico.");
  return (await res.json()) as T;
}

export const staticBibleProvider: BibleTextProvider = {
  async versions() {
    return (await getJson<BibleVersion[]>("/bible/versions.json")) ?? [];
  },

  async chapter(version, book, chapter) {
    const key = `${version}/${book}`;
    let pending = bookCache.get(key);
    if (!pending) {
      pending = getJson<{ code: string; chapters: Verse[][] }>(`/bible/${version}/${book}.json`).then((b) => {
        if (!b) throw new AppError("not_found", "Este libro no está disponible en esta versión.");
        return b;
      });
      bookCache.set(key, pending);
      pending.catch(() => bookCache.delete(key));
    }
    const data = await pending;
    return data.chapters[chapter - 1] ?? [];
  },
};
