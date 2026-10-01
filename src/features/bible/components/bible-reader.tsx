"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/feedback/state-view";
import { useSpeech } from "@/hooks/use-speech";
import { shareText } from "@/lib/native/share";
import { nextReadingScale } from "@/features/devotionals/domain/steps";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/utils/cn";
import { bookByCode, formatReference, stepChapter, type BibleRef } from "../domain/books";
import { HIGHLIGHTS, SELECTED_BG, highlightHex } from "../domain/highlights";
import { useBibleActions, useBibleVersions, useChapterMarks, useChapterText } from "../hooks/use-bible";
import { BookPicker } from "./book-picker";

const chip = "flex h-11 items-center justify-center rounded-full bg-[#F1EEE6] font-semibold";

/** Screen 5a · Biblia · toca un versículo. */
export function BibleReader({ initial }: { initial: BibleRef & { verse?: number } }) {
  const router = useRouter();
  const [ref, setRef] = useState<BibleRef>({ book: initial.book, chapter: initial.chapter });
  const [selected, setSelected] = useState<number | null>(initial.verse ?? null);
  const [picker, setPicker] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const prefs = useAppStore((s) => s.preferences);
  const setPreferences = useAppStore((s) => s.setPreferences);

  const versions = useBibleVersions();
  const version = versions.data?.find((v) => v.id === prefs.bibleVersion) ?? versions.data?.[0] ?? null;
  const text = useChapterText(version?.id ?? null, ref.book, ref.chapter);
  const marks = useChapterMarks(ref.book, ref.chapter);
  const actions = useBibleActions(ref.book, ref.chapter);
  const speech = useSpeech();
  const book = bookByCode(ref.book);

  // Remember where the person is reading; keep the URL shareable.
  useEffect(() => {
    setPreferences({ lastBibleRef: `${ref.book}:${ref.chapter}` });
    router.replace(`/biblia/?libro=${ref.book}&cap=${ref.chapter}`, { scroll: false });
  }, [ref, setPreferences, router]);

  useEffect(() => {
    if (initial.verse && text.data) document.getElementById(`v${initial.verse}`)?.scrollIntoView({ block: "center" });
  }, [initial.verse, text.data]);

  // Keep the selected verse visible above the action sheet (≈ 340px tall incl. nav).
  useEffect(() => {
    if (!selected) return;
    const el = document.getElementById(`v${selected}`);
    if (!el) return;
    const limit = window.innerHeight - 360;
    const rect = el.getBoundingClientRect();
    if (rect.bottom > limit) window.scrollBy({ top: rect.bottom - limit + 16, behavior: "smooth" });
  }, [selected]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const verseText = useMemo(() => new Map(text.data ?? []), [text.data]);
  const go = (next: BibleRef | null) => {
    if (!next) return;
    speech.stop();
    setSelected(null);
    setRef(next);
    window.scrollTo({ top: 0 });
  };

  const selectedRef = selected ? formatReference({ ...ref, verse: selected }) : "";
  const selectedText = selected ? (verseText.get(selected) ?? "") : "";
  const bookmarked = selected ? marks.data?.bookmarks.has(selected) : false;
  const currentColor = selected ? marks.data?.highlights[selected] : undefined;

  if (versions.isSuccess && !version) {
    return (
      <div className="px-3 pt-6">
        <StateView
          kind="empty"
          title="El texto bíblico aún no está instalado"
          message="Esta compilación no incluye una versión de la Biblia. Ejecuta `npm run bible:install` (Reina-Valera 1909, dominio público) y vuelve a compilar."
        />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#FFFDF8]">
      <div className="sticky top-0 z-20 flex items-center gap-2 bg-[#FFFDF8]/95 px-4 py-2 backdrop-blur">
        <button
          type="button"
          onClick={() => setPicker(true)}
          className="flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-[15px] font-bold text-white"
          aria-label={`${book?.name} ${ref.chapter}. Cambiar libro o capítulo`}
        >
          {book?.name} {ref.chapter} <ChevronDown className="size-3.5" aria-hidden />
        </button>
        <span
          className={cn(chip, "px-3.5 text-[13px]")}
          title={version ? `${version.name} · ${version.license}` : undefined}
        >
          {version?.abbreviation ?? "…"}
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setPreferences({ bibleFontScale: nextReadingScale(prefs.bibleFontScale) })}
          className={cn(chip, "size-11 text-sm")}
          aria-label="Cambiar tamaño del texto"
        >
          Aa
        </button>
        {speech.supported ? (
          <button
            type="button"
            onClick={() =>
              speech.speaking ? speech.stop() : speech.speak((text.data ?? []).map(([, t]) => t).join(" "))
            }
            className={cn(chip, "size-11")}
            aria-label={speech.speaking ? "Detener lectura en voz alta" : "Escuchar capítulo"}
          >
            {speech.speaking ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
          </button>
        ) : null}
      </div>

      <header className="flex flex-col gap-1.5 px-[26px] pt-5 pb-2.5">
        <span className="eyebrow tracking-[.12em] text-stage-vive">{book?.name} · Capítulo</span>
        <span className="font-display-x text-[64px] leading-[.85]">{ref.chapter}</span>
      </header>

      <div
        className="px-[26px] pt-1 pb-6 font-serif text-lg leading-[1.7]"
        style={{ fontSize: `${1.125 * prefs.bibleFontScale}rem` }}
      >
        {text.isPending ? (
          <div className="flex flex-col gap-2" role="status" aria-label="Cargando capítulo">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-5 rounded-md" />
            ))}
          </div>
        ) : text.isError ? (
          <StateView
            kind={text.error && "code" in text.error && text.error.code === "offline" ? "offline" : "error"}
            message="No pudimos cargar este capítulo."
            action={
              <Button variant="ink" size="sm" onClick={() => text.refetch()}>
                Reintentar
              </Button>
            }
          />
        ) : (
          <p className="m-0">
            {(text.data ?? []).map(([n, t]) => {
              const isSel = n === selected;
              const hl = highlightHex(marks.data?.highlights[n]);
              return (
                <span
                  key={n}
                  id={`v${n}`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSel}
                  onClick={() => setSelected(isSel ? null : n)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(isSel ? null : n);
                    }
                  }}
                  className="cursor-pointer rounded px-0.5 py-px [box-decoration-break:clone]"
                  style={{
                    background: hl ?? (isSel ? SELECTED_BG : "transparent"),
                    outline: isSel && hl ? "2px solid #3D8BFF" : undefined,
                  }}
                >
                  <sup className="mr-[3px] font-sans text-[10px] font-bold text-stage-vive">{n}</sup>
                  {t}
                  {marks.data?.notes[n] ? (
                    <span className="ml-0.5 text-violet" aria-label="tiene nota">
                      ✎
                    </span>
                  ) : null}{" "}
                </span>
              );
            })}
          </p>
        )}
      </div>

      <nav className={cn("flex justify-between px-4 pb-8", selected !== null && "pb-[300px]")} aria-label="Capítulos">
        <button
          type="button"
          onClick={() => go(stepChapter(ref, -1))}
          className={cn(chip, "gap-1 px-4 text-sm")}
          disabled={!stepChapter(ref, -1)}
        >
          <ChevronLeft className="size-4" aria-hidden /> Anterior
        </button>
        <Link href="/biblia/guardados" className={cn(chip, "px-4 text-sm")}>
          Guardados
        </Link>
        <button
          type="button"
          onClick={() => go(stepChapter(ref, 1))}
          className={cn(chip, "gap-1 px-4 text-sm")}
          disabled={!stepChapter(ref, 1)}
        >
          Siguiente <ChevronRight className="size-4" aria-hidden />
        </button>
      </nav>

      {selected ? (
        <div
          role="dialog"
          aria-label={`Acciones para ${selectedRef}`}
          className="animate-sheet-in fixed inset-x-2.5 z-40 mx-auto flex max-w-[580px] flex-col gap-3 rounded-[26px] bg-ink p-4 text-white shadow-[0_20px_40px_-12px_rgba(13,10,38,.5)]"
          style={{ bottom: "calc(96px + var(--safe-bottom))" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">{selectedRef}</span>
            <div className="flex gap-2" role="radiogroup" aria-label="Resaltar">
              {HIGHLIGHTS.map((h) => (
                <button
                  key={h.color}
                  type="button"
                  role="radio"
                  aria-checked={currentColor === h.color}
                  aria-label={`Resaltar en ${h.label.toLowerCase()}`}
                  onClick={() =>
                    actions.highlight.mutate({ verse: selected, color: currentColor === h.color ? null : h.color })
                  }
                  className={cn(
                    "size-7 rounded-full",
                    currentColor === h.color && "ring-2 ring-white ring-offset-2 ring-offset-ink",
                  )}
                  style={{ background: h.hex }}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setNoteDraft(marks.data?.notes[selected]?.body ?? "");
                setNoteOpen(true);
              }}
              className="h-12 rounded-[14px] bg-white/10"
            >
              Nota
            </button>
            <button
              type="button"
              onClick={() => actions.bookmark.mutate({ verse: selected, on: !bookmarked })}
              className="h-12 rounded-[14px] bg-white/10"
              aria-pressed={bookmarked}
            >
              {bookmarked ? "Guardado ✓" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={async () => {
                const r = await shareText({
                  title: selectedRef,
                  text: `“${selectedText}” — ${selectedRef} (${version?.abbreviation})`,
                });
                if (r === "copied") setToast("Copiado para compartir");
              }}
              className="h-12 rounded-[14px] bg-white/10"
            >
              Compartir
            </button>
            <button
              type="button"
              onClick={() => setToast("Muy pronto podrás preguntarle a tus líderes.")}
              className="h-12 rounded-[14px] bg-lime text-ink"
            >
              Preguntar
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-center text-xs font-semibold">
            <Link
              href={`/diario/entrada/?tipo=verse&ref=${encodeURIComponent(selectedRef)}&texto=${encodeURIComponent(selectedText)}`}
              className="flex h-11 items-center justify-center rounded-[14px] bg-white/10"
            >
              Reflexionar en mi diario
            </Link>
            <Link
              href={`/oracion/peticion/?ref=${encodeURIComponent(selectedRef)}`}
              className="flex h-11 items-center justify-center rounded-[14px] bg-white/10"
            >
              Orar con este versículo
            </Link>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div
          role="status"
          className="animate-fade-in fixed inset-x-6 z-50 mx-auto max-w-[420px] rounded-full bg-lime px-4 py-3 text-center text-sm font-semibold text-ink"
          style={{ bottom: "calc(110px + var(--safe-bottom))" }}
        >
          {toast}
        </div>
      ) : null}

      <BookPicker open={picker} current={ref} onClose={() => setPicker(false)} onPick={go} />

      <Sheet open={noteOpen} onClose={() => setNoteOpen(false)} title={`Nota · ${selectedRef}`}>
        <label htmlFor="bible-note" className="sr-only">
          Tu nota
        </label>
        <textarea
          id="bible-note"
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          maxLength={4000}
          rows={5}
          className="w-full rounded-[20px] border-[1.5px] border-ink/12 bg-white p-4 text-base focus:border-ink focus:outline-none"
          placeholder="Lo que este versículo te dice…"
        />
        <span className="text-[13px] font-semibold text-ink/60">🔒 Solo tú puedes leer tus notas</span>
        <div className="flex gap-2">
          {marks.data?.notes[selected ?? -1] ? (
            <Button
              variant="ghost"
              size="md"
              className="border-[1.5px] border-ink/20"
              onClick={() => {
                actions.note.mutate({ verse: selected!, body: null });
                setNoteOpen(false);
              }}
            >
              Borrar
            </Button>
          ) : null}
          <Button
            variant="ink"
            size="md"
            block
            loading={actions.note.isPending}
            onClick={() =>
              actions.note.mutate({ verse: selected!, body: noteDraft }, { onSuccess: () => setNoteOpen(false) })
            }
          >
            Guardar nota
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
