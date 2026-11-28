// Anunță prin IndexNow (Bing, Yandex, Seznam, Naver; Google nu folosește IndexNow) toate adresele din sitemap.
//   node scripts/indexnow.mjs [base-url] [--dry-run]
// base-url: de unde se citește sitemap.xml (implicit https://www.electrofield.ro). Adresele trimise sunt
// cele din sitemap, pe www.electrofield.ro. Rulează-l după un deploy în producție, nu înainte:
// motoarele vizitează imediat adresele. --dry-run doar afișează ce s-ar trimite.
import { readdir, readFile } from "node:fs/promises";

const HOST = "www.electrofield.ro";
const ENDPOINT = "https://api.indexnow.org/indexnow";
const BATCH = 10_000; // limita IndexNow pe o cerere

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const base = (args.find((a) => !a.startsWith("--")) || `https://${HOST}`).replace(/\/+$/, "");

// Cheia: fișierul public/<cheie>.txt, al cărui conținut e chiar cheia.
const publicDir = new URL("../public/", import.meta.url);
const keyFiles = (await readdir(publicDir)).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (keyFiles.length !== 1) throw new Error(`Aștepta un singur fișier-cheie IndexNow în public/, a găsit ${keyFiles.length}.`);
const key = (await readFile(new URL(keyFiles[0], publicDir), "utf8")).trim();
if (`${key}.txt` !== keyFiles[0] || !/^[a-zA-Z0-9-]{8,128}$/.test(key)) throw new Error(`Cheia din public/${keyFiles[0]} nu corespunde numelui fișierului.`);
const keyLocation = `https://${HOST}/${keyFiles[0]}`;

const response = await fetch(`${base}/sitemap.xml`, { headers: { "user-agent": "electrofield-indexnow" } });
if (!response.ok) throw new Error(`${base}/sitemap.xml: status ${response.status}`);
const xml = await response.text();
const urls = [...new Set([...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&")))];
const own = urls.filter((u) => new URL(u).host === HOST);
const skipped = urls.length - own.length;
if (!own.length) throw new Error(`Nicio adresă pe ${HOST} în ${base}/sitemap.xml.`);

console.log(`${own.length} adrese din ${base}/sitemap.xml${skipped ? ` (${skipped} de pe alt domeniu, sărite)` : ""}.`);
console.log(`cheie: ${keyLocation}`);

for (let i = 0; i < own.length; i += BATCH) {
  const urlList = own.slice(i, i + BATCH);
  const body = { host: HOST, key, keyLocation, urlList };
  if (dryRun) {
    console.log(`[dry-run] POST ${ENDPOINT} cu ${urlList.length} adrese:`);
    for (const u of urlList) console.log(`  ${u}`);
    continue;
  }
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  // 200: primit; 202: primit, cheia se verifică; 400/403/422/429: cerere greșită, cheie invalidă, adrese străine, prea dese.
  console.log(`POST ${ENDPOINT} (${urlList.length} adrese): ${res.status} ${res.statusText}${text ? `\n${text}` : ""}`);
  if (![200, 202].includes(res.status)) process.exitCode = 1;
}
