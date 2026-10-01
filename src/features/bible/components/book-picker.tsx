"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/utils/cn";
import { BOOKS, bookByCode, type BibleRef } from "../domain/books";

/** Book → chapter picker opened from the "Juan 15 ▾" pill. */
export function BookPicker({
  open,
  current,
  onClose,
  onPick,
}: {
  open: boolean;
  current: BibleRef;
  onClose: () => void;
  onPick: (ref: BibleRef) => void;
}) {
  const [testament, setTestament] = useState<"AT" | "NT">(bookByCode(current.book)?.testament ?? "NT");
  const [book, setBook] = useState<string | null>(null);
  const selected = book ? bookByCode(book) : null;

  const close = () => {
    setBook(null);
    onClose();
  };

  return (
    <Sheet open={open} onClose={close} title={selected ? selected.name : "Elige un libro"}>
      {selected ? (
        <>
          <button type="button" onClick={() => setBook(null)} className="self-start text-sm font-semibold text-violet">
            ← Libros
          </button>
          <div className="grid grid-cols-6 gap-1.5">
            {Array.from({ length: selected.chapters }, (_, i) => i + 1).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => {
                  onPick({ book: selected.code, chapter: ch });
                  close();
                }}
                className={cn(
                  "flex h-11 items-center justify-center rounded-xl text-sm font-semibold",
                  selected.code === current.book && ch === current.chapter ? "bg-ink text-lime" : "bg-white",
                )}
              >
                {ch}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex gap-1 self-start rounded-full bg-white p-1 text-[13px] font-semibold" role="tablist">
            {(["AT", "NT"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={testament === t}
                onClick={() => setTestament(t)}
                className={cn("rounded-full px-3 py-1.5", testament === t ? "bg-ink text-white" : "text-ink/55")}
              >
                {t === "AT" ? "Antiguo Testamento" : "Nuevo Testamento"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {BOOKS.filter((b) => b.testament === testament).map((b) => (
              <button
                key={b.code}
                type="button"
                onClick={() => setBook(b.code)}
                className={cn(
                  "flex min-h-11 items-center rounded-xl px-3 text-left text-sm font-semibold",
                  b.code === current.book ? "bg-ink text-white" : "bg-white",
                )}
              >
                {b.name}
              </button>
            ))}
          </div>
        </>
      )}
    </Sheet>
  );
}
