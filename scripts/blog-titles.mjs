// Generează src/lib/blog-titles.json (slug → titlul articolului) pentru numele paginilor din Analitice.
// Rulează după ce adaugi un articol: node scripts/blog-titles.mjs
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
const dir = new URL("../public/blog/", import.meta.url);
const out = {};
for (const f of readdirSync(dir).filter((f) => f.endsWith(".html") && f !== "index.html").sort()) {
  const m = readFileSync(new URL(f, dir), "utf8").match(/<title>([^<]+)<\/title>/i);
  if (m) out[f.replace(/\.html$/, "")] = m[1].replace(/\s*[|–-]\s*(Blog )?ElectroField\s*$/i, "").replace(/&amp;/g, "&").trim();
}
writeFileSync(new URL("../src/lib/blog-titles.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
console.log(Object.keys(out).length, "titluri");
