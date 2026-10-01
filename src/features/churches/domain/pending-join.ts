import { extractChurchCode } from "./church-code";

/**
 * A church code that arrived before the person had a session (e.g. scanning the
 * church QR with the phone camera). Kept for this browser session only so it can
 * be applied right after sign-up / sign-in.
 */
const KEY = "camino.pendingChurchCode";

export function savePendingChurchCode(code: string): void {
  try {
    window.sessionStorage.setItem(KEY, code);
  } catch {
    /* storage unavailable: the person can type the code */
  }
}

export function readPendingChurchCode(): string | null {
  try {
    const value = window.sessionStorage.getItem(KEY);
    return value ? extractChurchCode(value) : null;
  } catch {
    return null;
  }
}

export function clearPendingChurchCode(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Where to go right after authenticating. */
export function postAuthPath(): string {
  const code = readPendingChurchCode();
  return code ? `/unirse/?codigo=${code}` : "/inicio";
}
