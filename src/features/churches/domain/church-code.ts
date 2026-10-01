/**
 * Church join codes: 6–12 uppercase letters/digits (DB constraint).
 * The same code can arrive typed, inside a QR, or in a link:
 *   VIDA26 · https://<app>/unirse/?codigo=VIDA26 · camino://unirse/VIDA26
 */
export const CHURCH_CODE_MIN = 6;
export const CHURCH_CODE_MAX = 12;
const CODE = /^[A-Z0-9]{6,12}$/;

/** Keeps only A–Z/0–9 (uppercased) and caps the length; used while typing. */
export function normalizeChurchCode(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, CHURCH_CODE_MAX);
}

export function isCompleteChurchCode(code: string): boolean {
  return CODE.test(code);
}

/** Extracts a valid code from scanned/opened content, or null. */
export function extractChurchCode(raw: string): string | null {
  const text = raw.trim();
  if (CODE.test(text.toUpperCase())) return text.toUpperCase();

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  const fromQuery = url.searchParams.get("codigo") ?? url.searchParams.get("code");
  const segments = [url.hostname, ...url.pathname.split("/")].filter(Boolean);
  const joinIndex = segments.findIndex((s) => s.toLowerCase() === "unirse");
  const fromPath = joinIndex >= 0 ? segments[joinIndex + 1] : undefined;
  const candidate = (fromQuery ?? fromPath ?? "").toUpperCase();
  return CODE.test(candidate) ? candidate : null;
}
