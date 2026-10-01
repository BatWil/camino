import { env } from "@/lib/env";

/**
 * Deep links: `camino://events/{id}` and `https://<app host>/events/{id}` both
 * resolve to the in-app path `/events/{id}`. Only known top-level sections are
 * accepted so a crafted link can never navigate to arbitrary URLs.
 */
export const DEEP_LINK_SECTIONS = [
  "inicio",
  "camino",
  "comunidad",
  "perfil",
  "events",
  "plans",
  "devotionals",
  "church",
  "conference",
  "auth",
  "unirse",
] as const;

const SEGMENT = /^[A-Za-z0-9_-]{1,64}$/;

export function resolveDeepLink(rawUrl: string, options: { scheme?: string; appUrl?: string } = {}): string | null {
  const scheme = options.scheme ?? env.appScheme;
  const appUrl = options.appUrl ?? env.appUrl;

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  let segments: string[];
  if (url.protocol === `${scheme}:`) {
    // camino://events/123 → host "events", pathname "/123"
    segments = [url.hostname, ...url.pathname.split("/")].filter(Boolean);
  } else if (url.protocol === "https:" || url.protocol === "http:") {
    let appHost: string;
    try {
      appHost = new URL(appUrl).host;
    } catch {
      return null;
    }
    if (url.host !== appHost) return null;
    segments = url.pathname.split("/").filter(Boolean);
  } else {
    return null;
  }

  if (segments.length === 0) return "/";
  const [section] = segments;
  if (!(DEEP_LINK_SECTIONS as readonly string[]).includes(section)) return null;
  if (!segments.every((s) => SEGMENT.test(s))) return null;

  const params = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (SEGMENT.test(key)) params.append(key, value);
  });
  const query = params.toString();
  return `/${segments.join("/")}${query ? `?${query}` : ""}`;
}
