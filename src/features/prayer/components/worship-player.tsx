"use client";

import { useEffect, useRef, useState } from "react";
import { Music2, X } from "lucide-react";
import { tap } from "@/lib/native/haptics";
import { WORSHIP_PLAYLIST, playerCommand, worshipEmbedUrl } from "../domain/worship";

type State = "suggest" | "playing" | "off";

/**
 * Suggests a worship playlist when prayer starts and plays it inside the same
 * screen, so the music keeps going while the person prays. Pausing the prayer
 * pauses the music too.
 */
export function WorshipPlayer({ paused }: { paused: boolean }) {
  const [state, setState] = useState<State>("suggest");
  const frame = useRef<HTMLIFrameElement>(null);
  const [origin] = useState(() => (typeof window === "undefined" ? undefined : window.location.origin));
  const src = worshipEmbedUrl(WORSHIP_PLAYLIST.listId, origin);

  useEffect(() => {
    if (state !== "playing") return;
    frame.current?.contentWindow?.postMessage(playerCommand(paused ? "pauseVideo" : "playVideo"), "*");
  }, [paused, state]);

  if (!src || state === "off") return null;

  if (state === "suggest") {
    return (
      <div
        role="group"
        aria-label="Música para orar"
        className="animate-rise flex w-full max-w-[320px] items-center gap-3 rounded-[20px] bg-paper/10 p-3 pl-4"
      >
        <Music2 className="size-5 flex-none text-stage-comparte" aria-hidden />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[13px] text-paper/60">¿Oras con música?</span>
          <span className="truncate text-sm font-semibold">{WORSHIP_PLAYLIST.title}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            tap();
            setState("playing");
          }}
          className="h-9 flex-none rounded-full bg-paper px-3.5 text-[13px] font-bold text-[#15103A]"
        >
          Reproducir
        </button>
        <button
          type="button"
          onClick={() => setState("off")}
          aria-label="Orar sin música"
          className="flex size-9 flex-none items-center justify-center rounded-full text-paper/50"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="animate-rise flex w-full max-w-[320px] flex-col gap-2">
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="flex min-w-0 items-center gap-2 text-[13px] text-paper/60">
          <Music2 className="size-4 flex-none text-stage-comparte" aria-hidden />
          <span className="truncate">{WORSHIP_PLAYLIST.title}</span>
        </span>
        <button
          type="button"
          onClick={() => setState("off")}
          className="flex-none text-[13px] font-semibold text-paper/60"
        >
          Quitar música
        </button>
      </div>
      <iframe
        ref={frame}
        src={src}
        title={`Música para orar: ${WORSHIP_PLAYLIST.title}`}
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        className="aspect-video w-full rounded-2xl border-0 bg-black/30"
      />
    </div>
  );
}
