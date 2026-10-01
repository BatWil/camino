/**
 * Música sugerida para el Modo oración.
 *
 * ⚠️ Playlist provisional: cámbiala aquí por la que elija el ministerio.
 * `listId` es el valor de `list=` en la URL de una playlist de YouTube
 * (https://www.youtube.com/playlist?list=XXXX). Debe ser pública y permitir
 * insertarse en otros sitios.
 */
export const WORSHIP_PLAYLIST = {
  title: "Para orar y adorar a Dios",
  listId: "PL6XtAMu7eOyiOpVb07duPHseAcSTToV7t",
} as const;

/** Embed URL (youtube-nocookie: no cookies until the person plays). */
export function worshipEmbedUrl(listId: string, origin?: string): string | null {
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(listId)) return null;
  const q = new URLSearchParams({
    list: listId,
    autoplay: "1",
    playsinline: "1",
    enablejsapi: "1",
    rel: "0",
  });
  if (origin) q.set("origin", origin);
  return `https://www.youtube-nocookie.com/embed/videoseries?${q}`;
}

/** Message for the YouTube iframe API (works with enablejsapi=1, no script needed). */
export function playerCommand(func: "playVideo" | "pauseVideo"): string {
  return JSON.stringify({ event: "command", func, args: [] });
}
