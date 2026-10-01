"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SplashState } from "@/components/layout/splash-state";
import { localIsoDate } from "@/features/rhythm/domain/rhythm";
import type { JournalKind } from "@/lib/supabase/database.types";
import { AppError } from "@/types/result";
import { cn } from "@/utils/cn";
import type { JournalEntry } from "../data/journal.repository";
import { KIND_META } from "../domain/journal";
import { useJournalEntry, useJournalMutations } from "../hooks/use-journal";

const KINDS: JournalKind[] = ["free", "gratitude", "struggle", "reflection", "verse"];

export interface EditorSeed {
  kind: JournalKind;
  body: string;
  verseRef: string | null;
  verseText: string | null;
  devotionalId: string | null;
  prompt: string | null;
}

function Editor({ entry, seed }: { entry: JournalEntry | null; seed: EditorSeed }) {
  const router = useRouter();
  const { create, update, remove } = useJournalMutations();
  const [kind, setKind] = useState<JournalKind>(entry?.kind ?? seed.kind);
  const [body, setBody] = useState(entry?.body ?? seed.body);
  const [verseRef, setVerseRef] = useState(entry?.verse_ref ?? seed.verseRef ?? "");
  const [notice, setNotice] = useState<string | null>(null);
  const verseText = entry?.verse_text ?? seed.verseText;
  const busy = create.isPending || update.isPending || remove.isPending;
  const error = [create.error, update.error, remove.error].find(Boolean);

  const save = async () => {
    const text = body.trim();
    if (!text) return;
    if (entry) {
      await update.mutateAsync({
        id: entry.id,
        kind,
        body: text,
        verse_ref: verseRef || null,
        verse_text: verseText,
        entry_date: entry.entry_date,
      });
      router.replace("/diario");
      return;
    }
    const result = await create.mutateAsync({
      id: crypto.randomUUID(),
      kind,
      body: text,
      verse_ref: verseRef || null,
      verse_text: verseText,
      devotional_id: seed.devotionalId,
      entry_date: localIsoDate(new Date()),
    });
    if (result === "queued") {
      setNotice("Sin conexión: tu entrada quedó guardada y cifrada en este dispositivo. Se sincroniza sola.");
      setTimeout(() => router.replace("/diario"), 1800);
    } else router.replace("/diario");
  };

  return (
    <main className="pt-safe pb-safe flex min-h-dvh flex-col bg-ink text-paper">
      <div className="mx-auto flex w-full max-w-[600px] flex-1 flex-col gap-4 px-5 pt-2 pb-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="flex size-10 items-center justify-center rounded-full bg-white/10"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          <span className="flex items-center gap-1.5 rounded-full bg-lime/15 px-3 py-2 font-mono text-[11px] font-semibold text-lime">
            <Lock className="size-3" aria-hidden /> SOLO TÚ
          </span>
        </div>

        <div
          className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]"
          role="radiogroup"
          aria-label="Tipo de entrada"
        >
          {(entry?.kind === "devotional" || seed.kind === "devotional" ? [...KINDS, "devotional" as const] : KINDS).map(
            (k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => setKind(k)}
                className={cn(
                  "flex-none rounded-full px-3 py-2 text-xs font-semibold",
                  kind === k ? "bg-paper text-ink" : "border border-paper/25",
                )}
              >
                {KIND_META[k].label}
              </button>
            ),
          )}
        </div>

        {seed.prompt && !entry ? <p className="m-0 text-xl leading-[1.2] font-bold">{seed.prompt}</p> : null}

        {kind === "verse" || verseText ? (
          <div className="flex flex-col gap-2 rounded-[22px] bg-white/[.06] p-4">
            <label htmlFor="verse-ref" className="eyebrow text-stage-vive">
              Versículo
            </label>
            <input
              id="verse-ref"
              value={verseRef}
              onChange={(e) => setVerseRef(e.target.value)}
              maxLength={80}
              placeholder="Juan 15:5"
              className="bg-transparent text-[15px] font-semibold placeholder:text-paper/40 focus:outline-none"
            />
            {verseText ? (
              <p className="m-0 font-serif text-[15px] leading-normal text-paper/85 italic">“{verseText}”</p>
            ) : null}
          </div>
        ) : null}

        <label htmlFor="journal-body" className="sr-only">
          Tu entrada
        </label>
        <textarea
          id="journal-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={10000}
          placeholder="Escribe con libertad…"
          className="min-h-[240px] flex-1 resize-none rounded-[22px] border-[1.5px] border-paper/15 bg-white/[.06] p-4 text-base leading-relaxed placeholder:text-paper/40 focus:border-lime focus:outline-none"
        />
        <p className="m-0 text-[13px] text-paper/60">Nadie más puede leer tu diario: ni tus líderes ni tu mentor.</p>

        <p aria-live="polite" className={cn("m-0 min-h-5 text-sm", error ? "text-coral" : "text-lime")}>
          {error instanceof AppError ? error.message : error ? "No pudimos guardar." : (notice ?? "")}
        </p>
        <div className="flex gap-2">
          {entry ? (
            <Button
              variant="outline"
              size="lg"
              disabled={busy}
              onClick={async () => {
                if (!window.confirm("¿Borrar esta entrada? No se puede deshacer.")) return;
                await remove.mutateAsync(entry.id);
                router.replace("/diario");
              }}
            >
              Borrar
            </Button>
          ) : null}
          <Button variant="lime" size="lg" block loading={busy} disabled={!body.trim()} onClick={save}>
            Guardar
          </Button>
        </div>
      </div>
    </main>
  );
}

export function JournalEditor({ id, seed }: { id: string | null; seed: EditorSeed }) {
  const entry = useJournalEntry(id);
  if (id && entry.isPending) return <SplashState />;
  return <Editor entry={entry.data ?? null} seed={seed} />;
}
