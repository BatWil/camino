/**
 * Writes out/.well-known/assetlinks.json for Android App Links after `next build`.
 *
 *   ANDROID_SHA256_CERT_FINGERPRINTS="AA:BB:…,CC:DD:…"   (Play App Signing key, and upload key if you sideload)
 *   ANDROID_APP_ID=app.camino                            (optional)
 *
 * Fingerprints are public values, but they are read from the environment so each deployment
 * (staging / production) can use its own signing keys. Without them, nothing is written.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FINGERPRINT = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;

/** @param {string | undefined} raw */
export function parseFingerprints(raw) {
  return (raw ?? "")
    .split(/[\s,]+/)
    .map((f) => f.trim().toUpperCase())
    .filter(Boolean)
    .filter((f) => {
      if (FINGERPRINT.test(f)) return true;
      console.warn(`assetlinks: ignoring malformed fingerprint "${f}"`);
      return false;
    });
}

/** @param {string} appId @param {string[]} fingerprints */
export function assetLinks(appId, fingerprints) {
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: { namespace: "android_app", package_name: appId, sha256_cert_fingerprints: fingerprints },
    },
  ];
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const fingerprints = parseFingerprints(process.env.ANDROID_SHA256_CERT_FINGERPRINTS);
  if (!fingerprints.length) {
    console.log("assetlinks: ANDROID_SHA256_CERT_FINGERPRINTS not set — skipped (App Links stay unverified).");
  } else {
    const out = join(root, "out/.well-known/assetlinks.json");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(
      out,
      JSON.stringify(assetLinks(process.env.ANDROID_APP_ID || "app.camino", fingerprints), null, 2) + "\n",
    );
    console.log(`assetlinks: wrote ${fingerprints.length} fingerprint(s) to out/.well-known/assetlinks.json`);
  }
}
