import type { Tables } from "@/lib/supabase/database.types";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";

export type HighlightColor = "yellow" | "green" | "blue" | "violet";
export type BibleNote = Tables<"bible_notes">;

export interface ChapterMarks {
  highlights: Record<number, HighlightColor>;
  bookmarks: Set<number>;
  notes: Record<number, BibleNote>;
}

const fail = (error: unknown) => {
  throw new AppError("unknown", "No pudimos guardar en tu Biblia.", error);
};

/** Personal Bible data. RLS: only the owner can read or write any of it. */
export const bibleUserRepository = {
  async chapterMarks(book: string, chapter: number): Promise<ChapterMarks> {
    const sb = requireSupabase();
    const [h, b, n] = await Promise.all([
      sb.from("bible_highlights").select("verse, color").eq("book", book).eq("chapter", chapter),
      sb.from("bible_bookmarks").select("verse").eq("book", book).eq("chapter", chapter),
      sb.from("bible_notes").select("*").eq("book", book).eq("chapter", chapter),
    ]);
    if (h.error || b.error || n.error)
      throw new AppError("unknown", "No pudimos cargar tus marcas.", h.error ?? b.error ?? n.error);
    return {
      highlights: Object.fromEntries(h.data.map((r) => [r.verse, r.color])),
      bookmarks: new Set(b.data.map((r) => r.verse)),
      notes: Object.fromEntries(n.data.map((r) => [r.verse, r])),
    };
  },

  async setHighlight(book: string, chapter: number, verse: number, color: HighlightColor | null) {
    const sb = requireSupabase();
    if (color === null) {
      const { error } = await sb.from("bible_highlights").delete().match({ book, chapter, verse });
      if (error) fail(error);
      return;
    }
    const { error } = await sb
      .from("bible_highlights")
      .upsert({ book, chapter, verse, color }, { onConflict: "user_id,book,chapter,verse" });
    if (error) fail(error);
  },

  async setBookmark(book: string, chapter: number, verse: number, on: boolean) {
    const sb = requireSupabase();
    const { error } = on
      ? await sb.from("bible_bookmarks").upsert({ book, chapter, verse }, { onConflict: "user_id,book,chapter,verse" })
      : await sb.from("bible_bookmarks").delete().match({ book, chapter, verse });
    if (error) fail(error);
  },

  async saveNote(book: string, chapter: number, verse: number, body: string | null) {
    const sb = requireSupabase();
    const text = body?.trim();
    const { error } = text
      ? await sb
          .from("bible_notes")
          .upsert({ book, chapter, verse, body: text }, { onConflict: "user_id,book,chapter,verse" })
      : await sb.from("bible_notes").delete().match({ book, chapter, verse });
    if (error) fail(error);
  },

  async saved() {
    const sb = requireSupabase();
    const [b, n, h] = await Promise.all([
      sb.from("bible_bookmarks").select("book, chapter, verse, created_at").order("created_at", { ascending: false }),
      sb.from("bible_notes").select("book, chapter, verse, body, updated_at").order("updated_at", { ascending: false }),
      sb
        .from("bible_highlights")
        .select("book, chapter, verse, color, created_at")
        .order("created_at", { ascending: false }),
    ]);
    if (b.error || n.error || h.error)
      throw new AppError("unknown", "No pudimos cargar tus guardados.", b.error ?? n.error ?? h.error);
    return { bookmarks: b.data, notes: n.data, highlights: h.data };
  },
};
