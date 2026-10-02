"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Music2, X } from "lucide-react";
import { tap } from "@/lib/native/haptics";
import { WORSHIP_PLAYLIST, spotifyEmbedUrl, spotifyOpenUrl, spotifyUri } from "../domain/worship";

type State = "suggest" | "playing" | "off";

/** Subset of the Spotify iFrame API (https://developer.spotify.com/documentation/embeds). */
interface SpotifyController {
  play(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
  addListener(event: "ready", cb: () => void): void;
  addListener(event: "playback_update", cb: (e: { data: { isPaused: boolean } }) => void): void;
}
interface SpotifyIFrameAPI {
  createController(
    el: HTMLElement,
    opts: { uri: string; width: string; height: number; theme?: "dark" },
    cb: (c: SpotifyController) => void,
  ): void;
}
type SpotifyWindow = Window & { onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void };

const API_SRC = "https://open.spotify.com/embed/iframe-api/v1";
let apiPromise: Promise<SpotifyIFrameAPI> | null = null;

/** Loads the Spotify iFrame API once (only after the person chooses music). */
function loadSpotifyApi(): Promise<SpotifyIFrameAPI> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<SpotifyIFrameAPI>((resolve, reject) => {
    const w = window as SpotifyWindow;
    w.onSpotifyIframeApiReady = resolve;
    const s = document.createElement("script");
    s.src = API_SRC;
    s.async = true;
    s.onerror = () => {
      apiPromise = null;
      s.remove();
      reject(new Error("spotify api"));
    };
    document.body.appendChild(s);
    setTimeout(() => reject(new Error("spotify api timeout")), 8000);
  });
  return apiPromise;
}

/** Spotify's compact player (cover, song and play button in one row). */
const PLAYER_HEIGHT = 80;

function SpotifyEmbed({ paused }: { paused: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<SpotifyController | null>(null);
  const isPaused = useRef(true);
  const resumeOnUnpause = useRef(false);
  const [fallback, setFallback] = useState(false);
  const uri = spotifyUri(WORSHIP_PLAYLIST.playlistId);

  useEffect(() => {
    if (!uri || !host.current) return;
    let alive = true;
    // The API replaces this node with its iframe, so React never owns it.
    const node = document.createElement("div");
    host.current.appendChild(node);
    loadSpotifyApi()
      .then((api) => {
        if (!alive) return;
        api.createController(node, { uri, width: "100%", height: PLAYER_HEIGHT, theme: "dark" }, (c) => {
          if (!alive) return c.destroy();
          controller.current = c;
          c.addListener("playback_update", (e) => (isPaused.current = e.data.isPaused));
          c.addListener("ready", () => c.play());
        });
      })
      .catch(() => alive && setFallback(true));
    const container = host.current;
    return () => {
      alive = false;
      controller.current?.destroy();
      controller.current = null;
      container.replaceChildren();
    };
  }, [uri]);

  // Pausing the prayer pauses the music; continuing resumes it only if it was playing.
  useEffect(() => {
    const c = controller.current;
    if (!c) return;
    if (paused) {
      resumeOnUnpause.current = !isPaused.current;
      if (resumeOnUnpause.current) c.pause();
    } else if (resumeOnUnpause.current) {
      resumeOnUnpause.current = false;
      c.resume();
    }
  }, [paused]);

  const embed = spotifyEmbedUrl(WORSHIP_PLAYLIST.playlistId);
  if (fallback && embed) {
    return (
      <iframe
        src={embed}
        title={`Música para orar: ${WORSHIP_PLAYLIST.title}`}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="w-full rounded-xl border-0"
        style={{ height: PLAYER_HEIGHT }}
      />
    );
  }
  return (
    <div
      ref={host}
      className="w-full overflow-hidden rounded-xl bg-black/30"
      style={{ height: PLAYER_HEIGHT }}
      aria-label={`Música para orar: ${WORSHIP_PLAYLIST.title}`}
    />
  );
}

/**
 * Suggests a Spotify worship playlist when prayer starts and plays it inside
 * the same screen while the person prays.
 */
export function WorshipPlayer({ paused }: { paused: boolean }) {
  const [state, setState] = useState<State>("suggest");
  const openUrl = spotifyOpenUrl(WORSHIP_PLAYLIST.playlistId);

  if (!openUrl || state === "off") return null;

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
    <div className="animate-rise flex w-full max-w-[320px] flex-col gap-1.5">
      <SpotifyEmbed paused={paused} />
      <div className="flex items-center justify-between gap-2 px-1 text-xs">
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 font-semibold text-stage-comparte"
        >
          Abrir en Spotify <ExternalLink className="size-3" aria-hidden />
        </a>
        <button type="button" onClick={() => setState("off")} className="flex-none font-semibold text-paper/60">
          Quitar música
        </button>
      </div>
    </div>
  );
}
