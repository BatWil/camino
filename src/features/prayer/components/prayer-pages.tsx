"use client";

import { useSearchParams } from "next/navigation";
import { PrayerEditor } from "./prayer-editor";
import { PrayerMode } from "./prayer-mode";

export function PrayerEditorPage() {
  const p = useSearchParams();
  return <PrayerEditor id={p.get("id")} verseRef={p.get("ref")?.slice(0, 80) ?? null} />;
}

export function PrayerModePage() {
  const p = useSearchParams();
  const min = p.get("min");
  const minutes = min && /^\d{1,3}$/.test(min) ? Math.min(120, Math.max(1, Number(min))) : null;
  return <PrayerMode minutes={minutes} prayerId={p.get("peticion")} />;
}
