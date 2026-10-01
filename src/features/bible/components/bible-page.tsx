"use client";

import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/stores/app-store";
import { bookByCode } from "../domain/books";
import { BibleReader } from "./bible-reader";

/** /biblia/?libro=JHN&cap=15&v=5 — falls back to where the person left off, then Juan 1. */
export function BiblePage() {
  const params = useSearchParams();
  const last = useAppStore((s) => s.preferences.lastBibleRef);
  const [lastBook, lastChapter] = (last ?? "").split(":");

  const book = params.get("libro") ?? lastBook ?? "JHN";
  const meta = bookByCode(book) ?? bookByCode("JHN")!;
  const chapterParam = Number(params.get("cap") ?? (book === lastBook ? lastChapter : 1));
  const chapter =
    Number.isInteger(chapterParam) && chapterParam >= 1 && chapterParam <= meta.chapters ? chapterParam : 1;
  const verse = Number(params.get("v")) || undefined;

  return <BibleReader key={`${meta.code}-${chapter}`} initial={{ book: meta.code, chapter, verse }} />;
}
