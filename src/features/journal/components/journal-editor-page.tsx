"use client";

import { useSearchParams } from "next/navigation";
import type { JournalKind } from "@/lib/supabase/database.types";
import { JournalEditor } from "./journal-editor";

const KINDS = new Set(["free", "gratitude", "struggle", "reflection", "verse", "devotional"]);

/** /diario/entrada/?id=… (edit) or ?tipo=verse&ref=…&texto=… / ?pregunta=… / ?tipo=devotional&devocional=… */
export function JournalEditorPage() {
  const p = useSearchParams();
  const tipo = p.get("tipo") ?? "";
  const kind = (KINDS.has(tipo) ? tipo : p.get("pregunta") ? "reflection" : "free") as JournalKind;
  return (
    <JournalEditor
      id={p.get("id")}
      seed={{
        kind,
        body: p.get("cuerpo")?.slice(0, 10000) ?? "",
        verseRef: p.get("ref")?.slice(0, 80) ?? null,
        verseText: p.get("texto")?.slice(0, 1500) ?? null,
        devotionalId: p.get("devocional"),
        prompt: p.get("pregunta")?.slice(0, 200) ?? null,
      }}
    />
  );
}
