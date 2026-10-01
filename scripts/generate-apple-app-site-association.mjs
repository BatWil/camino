/**
 * Writes out/.well-known/apple-app-site-association for iOS Universal Links after `next build`.
 *
 *   APPLE_TEAM_ID=ABCDE12345        (Apple Developer → Membership)
 *   APPLE_BUNDLE_ID=app.camino      (optional)
 *
 * Served as application/json by vercel.json. Without APPLE_TEAM_ID nothing is written.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** In-app routes opened by the app; anything else (e.g. /leader on desktop) stays on the web. */
export const APP_PATHS = [
  "/inicio/*",
  "/camino/*",
  "/comunidad/*",
  "/perfil/*",
  "/avisos/*",
  "/evento/*",
  "/eventos/*",
  "/plan/*",
  "/planes/*",
  "/devocional/*",
  "/reto/*",
  "/biblia/*",
  "/unirse/*",
  "/conferencia/*",
  "/ministerios/*",
  "/mentoria/*",
  "/preguntas/*",
  "/pregunta/*",
  "/auth/callback/*",
];

/** @param {string | undefined} teamId */
export function isTeamId(teamId) {
  return typeof teamId === "string" && /^[A-Z0-9]{10}$/.test(teamId);
}

/** @param {string} teamId @param {string} bundleId */
export function appSiteAssociation(teamId, bundleId) {
  const appID = `${teamId}.${bundleId}`;
  return {
    applinks: { details: [{ appIDs: [appID], components: APP_PATHS.map((p) => ({ "/": p })) }] },
    webcredentials: { apps: [appID] },
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  if (!teamId) {
    console.log("apple-app-site-association: APPLE_TEAM_ID not set — skipped (Universal Links stay off).");
  } else if (!isTeamId(teamId)) {
    console.warn(`apple-app-site-association: "${teamId}" is not a valid Apple Team ID — skipped.`);
  } else {
    const root = join(dirname(fileURLToPath(import.meta.url)), "..");
    const out = join(root, "out/.well-known/apple-app-site-association");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(
      out,
      JSON.stringify(appSiteAssociation(teamId, process.env.APPLE_BUNDLE_ID || "app.camino"), null, 2) + "\n",
    );
    console.log("apple-app-site-association: written");
  }
}
