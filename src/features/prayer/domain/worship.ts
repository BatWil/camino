/**
 * Música sugerida para el Modo oración (Spotify).
 *
 * ⚠️ Playlist provisional: cámbiala aquí por la que elija el ministerio.
 * `playlistId` es lo que va después de `/playlist/` en el enlace de Spotify
 * (https://open.spotify.com/playlist/XXXX?si=… → XXXX). Debe ser pública.
 */
export const WORSHIP_PLAYLIST = {
  title: "Canciones para orar",
  playlistId: "1RmfVPi6Tk1wESTOjsfDCd",
} as const;

const SPOTIFY_ID = /^[A-Za-z0-9]{22}$/;

export function isSpotifyId(id: string): boolean {
  return SPOTIFY_ID.test(id);
}

/** URI for the Spotify iFrame API controller. */
export function spotifyUri(id: string): string | null {
  return isSpotifyId(id) ? `spotify:playlist:${id}` : null;
}

/** Plain embed (fallback when the iFrame API script can't load). */
export function spotifyEmbedUrl(id: string): string | null {
  return isSpotifyId(id) ? `https://open.spotify.com/embed/playlist/${id}?theme=0` : null;
}

/** Opens the Spotify app when installed (full songs, keeps playing in the background). */
export function spotifyOpenUrl(id: string): string | null {
  return isSpotifyId(id) ? `https://open.spotify.com/playlist/${id}` : null;
}
