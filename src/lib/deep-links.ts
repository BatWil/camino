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
  "challenges",
] as const;

const SEGMENT = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * In-app routes that links (App Links, notification taps) may open directly. Anything else is
 * ignored, so a crafted URL or push payload can never navigate outside the app's own screens.
 */
const APP_ROUTES = [
  "inicio",
  "camino",
  "comunidad",
  "perfil",
  "avisos",
  "mentoria",
  "preguntas",
  "pregunta",
  "evento",
  "eventos",
  "servir",
  "bellas-artes",
  "misiones",
  "plan",
  "planes",
  "devocional",
  "reto",
  "checkin",
  "oracion",
  "diario",
  "biblia",
  "leader",
  "conferencia",
  "ministerios",
  "llamados",
  "recursos",
  "quiz",
  "unirse",
  "momentos",
  "historia",
];

export function isSafeInternalPath(path: unknown): path is string {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) return false;
  if (path.length > 512 || !/^\/[A-Za-z0-9/_?=&%.~-]*$/.test(path) || path.includes("..")) return false;
  const root = path.slice(1).split(/[/?]/)[0];
  return APP_ROUTES.includes(root);
}

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
    // App Links open real web routes (https://host/evento/?id=…) as-is.
    const direct = `${url.pathname}${url.search}`;
    if (isSafeInternalPath(direct)) return direct;
    segments = url.pathname.split("/").filter(Boolean);
  } else {
    return null;
  }

  if (segments.length === 0) return "/";
  const [section] = segments;

  // Static export: detail screens take the id as a query parameter.
  const DETAIL_ROUTES: Record<string, string> = {
    plans: "/plan/",
    devotionals: "/devocional/",
    challenges: "/reto/",
    events: "/evento/",
    conference: "/conferencia/",
  };
  if (DETAIL_ROUTES[section] && segments.length === 2 && SEGMENT.test(segments[1])) {
    return `${DETAIL_ROUTES[section]}?id=${segments[1]}`;
  }
  // Section lists that live under a Spanish route.
  const LIST_ROUTES: Record<string, string> = { events: "/eventos/", conference: "/ministerios/" };
  if (LIST_ROUTES[section] && segments.length === 1) return LIST_ROUTES[section];
  if (!(DEEP_LINK_SECTIONS as readonly string[]).includes(section)) return null;
  if (!segments.every((s) => SEGMENT.test(s))) return null;

  const params = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (SEGMENT.test(key)) params.append(key, value);
  });
  const query = params.toString();
  return `/${segments.join("/")}${query ? `?${query}` : ""}`;
}
