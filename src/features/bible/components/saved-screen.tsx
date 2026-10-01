"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/feedback/state-view";
import { bibleHref, formatReference } from "../domain/books";
import { highlightHex } from "../domain/highlights";
import { useBibleSaved } from "../hooks/use-bible";

/** Perfil → "Guardados y resaltados" (screen 6c menu). Private to the person. */
export function SavedScreen() {
  const saved = useBibleSaved();
  const empty = saved.data && !saved.data.bookmarks.length && !saved.data.notes.length && !saved.data.highlights.length;

  return (
    <div className="flex flex-col gap-5 px-5 pt-4 pb-6">
      <header className="flex items-center gap-3">
        <Link
          href="/biblia"
          aria-label="Volver a la Biblia"
          className="flex size-10 items-center justify-center rounded-full bg-white"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <h1 className="m-0 font-display-x text-[26px] leading-[.95]">Guardados y resaltados</h1>
      </header>
      {saved.isPending ? (
        <Skeleton className="h-60" />
      ) : saved.isError ? (
        <StateView kind="error" />
      ) : empty ? (
        <StateView
          kind="empty"
          title="Aún no guardas versículos"
          message="Toca un versículo en la Biblia para resaltarlo, guardarlo o escribir una nota."
        />
      ) : (
        <>
          {saved.data!.notes.length ? (
            <section className="flex flex-col gap-2" aria-labelledby="saved-notes">
              <h2 id="saved-notes" className="m-0 eyebrow text-ink/55">
                Notas
              </h2>
              {saved.data!.notes.map((n) => (
                <Link
                  key={`${n.book}${n.chapter}${n.verse}`}
                  href={bibleHref(n)}
                  className="flex flex-col gap-1 rounded-[22px] bg-white p-4"
                >
                  <span className="text-sm font-bold text-stage-vive">{formatReference(n)}</span>
                  <span className="text-[15px]">{n.body}</span>
                </Link>
              ))}
            </section>
          ) : null}
          {saved.data!.bookmarks.length ? (
            <section className="flex flex-col gap-2" aria-labelledby="saved-bookmarks">
              <h2 id="saved-bookmarks" className="m-0 eyebrow text-ink/55">
                Guardados
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {saved.data!.bookmarks.map((b) => (
                  <Link
                    key={`${b.book}${b.chapter}${b.verse}`}
                    href={bibleHref(b)}
                    className="rounded-full bg-white px-3.5 py-2 text-sm font-semibold"
                  >
                    {formatReference(b)}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
          {saved.data!.highlights.length ? (
            <section className="flex flex-col gap-2" aria-labelledby="saved-highlights">
              <h2 id="saved-highlights" className="m-0 eyebrow text-ink/55">
                Resaltados
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {saved.data!.highlights.map((h) => (
                  <Link
                    key={`${h.book}${h.chapter}${h.verse}`}
                    href={bibleHref(h)}
                    className="rounded-full px-3.5 py-2 text-sm font-semibold"
                    style={{ background: highlightHex(h.color) }}
                  >
                    {formatReference(h)}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
