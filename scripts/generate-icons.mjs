/**
 * Generates every app icon/splash from assets/icon.svg (brand mark from the design:
 * ink background + lime dot). Run after changing the artwork:  npm run icons
 *
 *  - public/icons/*            PWA icons (any + maskable), apple-touch-icon, favicon
 *  - android/app/src/main/res  launcher icons (legacy + adaptive foreground) and splash
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const INK = "#0D0A26";
const LIME = "#C6F432";

/** Lime dot on ink. `dot` is the dot diameter as a fraction of the canvas. */
function markSvg(size, dot, { rounded = false, background = INK } = {}) {
  const r = (size * dot) / 2;
  const radius = rounded ? size * 0.22 : 0;
  const bg = background ? `<rect width="${size}" height="${size}" rx="${radius}" fill="${background}"/>` : "";
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bg}<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="${LIME}"/></svg>`,
  );
}

async function png(svg, out, width = undefined, height = undefined) {
  mkdirSync(dirname(out), { recursive: true });
  let img = sharp(svg);
  if (width) img = img.resize(width, height ?? width);
  await img.png({ compressionLevel: 9 }).toFile(out);
}

async function pwa() {
  const dir = join(root, "public/icons");
  await png(markSvg(192, 0.43), join(dir, "icon-192.png"));
  await png(markSvg(512, 0.43), join(dir, "icon-512.png"));
  // Maskable: keep the dot inside the 80% safe zone.
  await png(markSvg(192, 0.34), join(dir, "icon-maskable-192.png"));
  await png(markSvg(512, 0.34), join(dir, "icon-maskable-512.png"));
  await png(markSvg(180, 0.43), join(dir, "apple-touch-icon.png"));
  await png(markSvg(32, 0.5), join(dir, "favicon-32.png"));
}

async function splash(width, height, out) {
  const d = Math.round(Math.min(width, height) * 0.16);
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${INK}"/><circle cx="${width / 2}" cy="${height / 2}" r="${d / 2}" fill="${LIME}"/></svg>`,
  );
  await png(svg, out);
}

async function android() {
  const res = join(root, "android/app/src/main/res");
  if (!existsSync(res)) {
    console.log("android/ not found — skipping native icons (run `npx cap add android` first)");
    return;
  }
  const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  for (const [name, scale] of Object.entries(densities)) {
    const legacy = Math.round(48 * scale);
    const adaptive = Math.round(108 * scale);
    const dir = join(res, `mipmap-${name}`);
    await png(markSvg(legacy, 0.43, { rounded: true }), join(dir, "ic_launcher.png"));
    await png(markSvg(legacy, 0.43, { rounded: false }), join(dir, "ic_launcher_round.png"));
    // Adaptive foreground: transparent canvas, dot within the 66dp safe zone.
    await png(markSvg(adaptive, 0.3, { background: null }), join(dir, "ic_launcher_foreground.png"));
  }
  writeFileSync(
    join(res, "values/ic_launcher_background.xml"),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${INK}</color>\n</resources>\n`,
  );

  const splashes = {
    drawable: [480, 320],
    "drawable-port-mdpi": [320, 480],
    "drawable-port-hdpi": [480, 800],
    "drawable-port-xhdpi": [720, 1280],
    "drawable-port-xxhdpi": [960, 1600],
    "drawable-port-xxxhdpi": [1280, 1920],
    "drawable-land-mdpi": [480, 320],
    "drawable-land-hdpi": [800, 480],
    "drawable-land-xhdpi": [1280, 720],
    "drawable-land-xxhdpi": [1600, 960],
    "drawable-land-xxxhdpi": [1920, 1280],
  };
  for (const [folder, [w, h]] of Object.entries(splashes)) {
    const dir = join(res, folder);
    if (existsSync(dir)) await splash(w, h, join(dir, "splash.png"));
  }
}

await pwa();
await android();
console.log("icons generated");
