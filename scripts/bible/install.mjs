/**
 * Installs a public-domain Bible text into public/bible/<id>/ (served statically,
 * cached for offline reading and bundled inside the native apps).
 *
 *   npm run bible:install                       # downloads Reina-Valera 1909 from eBible.org
 *   npm run bible:install -- --file ./spaRV1909_vpl.zip   # or a local .zip/.txt (VPL)
 *
 * Only public-domain or properly licensed texts may be installed. RV1909 is public domain.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync, strFromU8 } from "fflate";
import { CANONICAL, parseVpl, toBookFile } from "./vpl.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const VERSION = {
  id: "rv1909",
  name: "Reina-Valera 1909",
  abbreviation: "RV1909",
  license: "Dominio público",
  source: "https://ebible.org/Scriptures/spaRV1909_vpl.zip",
};

function argValue(name) {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
}

async function loadSource() {
  const file = argValue("--file");
  let bytes;
  if (file) {
    bytes = new Uint8Array(readFileSync(file));
  } else {
    console.log(`Descargando ${VERSION.source} …`);
    const res = await fetch(VERSION.source);
    if (!res.ok) throw new Error(`No se pudo descargar (${res.status}). Descárgalo a mano y usa --file.`);
    bytes = new Uint8Array(await res.arrayBuffer());
  }
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (!isZip) return strFromU8(bytes);
  const entries = unzipSync(bytes);
  const name =
    Object.keys(entries).find((n) => /_vpl\.txt$/i.test(n)) ?? Object.keys(entries).find((n) => n.endsWith(".txt"));
  if (!name) throw new Error("El .zip no contiene un archivo VPL (.txt).");
  return strFromU8(entries[name]);
}

const books = parseVpl(await loadSource());
const missing = CANONICAL.filter((c) => !books[c]);
if (missing.length > 10) throw new Error(`El archivo no parece una Biblia completa (faltan ${missing.length} libros).`);

const outDir = join(root, "public/bible", VERSION.id);
mkdirSync(outDir, { recursive: true });
const index = { ...VERSION, books: [] };
let verses = 0;
for (const code of CANONICAL) {
  if (!books[code]) continue;
  const file = toBookFile(code, books[code]);
  verses += file.chapters.reduce((n, c) => n + c.length, 0);
  index.books.push({ code, chapters: file.chapters.length });
  writeFileSync(join(outDir, `${code}.json`), JSON.stringify(file));
}
writeFileSync(join(outDir, "index.json"), JSON.stringify(index));
writeFileSync(
  join(root, "public/bible/versions.json"),
  JSON.stringify([
    { id: VERSION.id, name: VERSION.name, abbreviation: VERSION.abbreviation, license: VERSION.license },
  ]),
);
console.log(`✓ ${VERSION.name}: ${index.books.length} libros, ${verses} versículos → public/bible/${VERSION.id}/`);
if (missing.length) console.warn(`Aviso: faltan ${missing.join(", ")}`);
