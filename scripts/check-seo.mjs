// Verificări SEO tehnice pe site-ul servit (producție sau un server local de producție).
//   node scripts/check-seo.mjs [base-url] [--strict]
// base-url: implicit https://www.electrofield.ro (ex. http://localhost:3100 după `next build && next start -p 3100`).
// Erorile opresc scriptul cu cod 1. Avertismentele (lungimea titlului și a descrierii) devin erori cu --strict.
import { readdir, readFile } from "node:fs/promises";
import { createJiti } from "jiti";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const base = (args.find((a) => !a.startsWith("--")) || "https://www.electrofield.ro").replace(/\/+$/, "");
const ORIGIN = "https://www.electrofield.ro";
const ROOT = new URL("../", import.meta.url);

const jiti = createJiti(import.meta.url);
const { MARKETING_SLUGS } = await jiti.import("../src/lib/marketing-pages.ts");
const { classifyPath } = await jiti.import("../src/lib/route-access.ts");

const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
const warn = (msg) => (strict ? errors : warnings).push(msg);

async function fetchRaw(path) {
  return fetch(`${base}${path}`, { redirect: "manual", headers: { "user-agent": "electrofield-seo-check" } });
}
async function getOk(path) {
  const response = await fetchRaw(path);
  if (response.status !== 200) {
    fail(`${path}: status ${response.status} (aștepta 200)`);
    return null;
  }
  return { response, text: await response.text() };
}

const decode = (s) => s
  .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([a-zA-Z:_-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) out[m[1].toLowerCase()] = decode(m[3] ?? m[4] ?? "");
  return out;
}
function head(html) {
  // Fără SVG-uri: un <title> dintr-un SVG din pagină nu e titlul paginii. Tot documentul, nu doar
  // <head>, pentru că Next poate trimite metadatele mai târziu în pagină (streaming metadata).
  const top = html.replace(/<svg[\s>][\s\S]*?<\/svg>/gi, "");
  const metas = [...top.matchAll(/<meta\s[^>]*>/gi)].map((m) => attrs(m[0]));
  const links = [...top.matchAll(/<link\s[^>]*>/gi)].map((m) => attrs(m[0]));
  const meta = (key, value) => metas.filter((m) => m[key] === value).map((m) => m.content ?? "");
  return {
    titles: [...top.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => decode(m[1]).trim()),
    descriptions: meta("name", "description"),
    robots: meta("name", "robots"),
    ogImage: meta("property", "og:image")[0],
    canonical: links.find((l) => (l.rel ?? "").split(/\s+/).includes("canonical"))?.href,
    h1: (html.match(/<h1[\s>]/gi) ?? []).length,
  };
}

// 1. robots.txt
const robots = await getOk("/robots.txt");
if (robots) {
  if (!robots.text.includes(`Sitemap: ${ORIGIN}/sitemap.xml`)) fail("robots.txt: lipsește linia Sitemap");
  for (const rule of ["Disallow: /api/", "Disallow: /downloads/"]) if (!robots.text.includes(rule)) fail(`robots.txt: lipsește „${rule}”`);
  if (/^Disallow:\s*\/\s*$/m.test(robots.text)) fail("robots.txt: blochează tot site-ul");
}

// 2. sitemap.xml: exact paginile publice așteptate, fiecare cu <lastmod>
const articles = (await readdir(new URL("public/blog/", ROOT)))
  .filter((file) => file.endsWith(".html") && file !== "index.html")
  .map((file) => `/blog/${file.slice(0, -5)}`);
const expected = ["/", ...MARKETING_SLUGS.map((s) => `/${s}`), "/blog", ...articles, "/programare", "/termeni", "/confidentialitate"];
const sitemap = await getOk("/sitemap.xml");
let entries = [];
if (sitemap) {
  entries = [...sitemap.text.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
    loc: /<loc>(.*?)<\/loc>/.exec(m[1])?.[1] ?? "",
    lastmod: /<lastmod>(.*?)<\/lastmod>/.exec(m[1])?.[1],
  }));
  const locs = entries.map((e) => e.loc);
  if (new Set(locs).size !== locs.length) fail("sitemap.xml: adrese duplicate");
  const want = new Set(expected.map((p) => (p === "/" ? `${ORIGIN}/` : `${ORIGIN}${p}`)));
  for (const url of want) if (!locs.includes(url)) fail(`sitemap.xml: lipsește ${url}`);
  for (const url of locs) if (!want.has(url)) fail(`sitemap.xml: adresă neașteptată ${url}`);
  const tomorrow = Date.now() + 864e5;
  for (const e of entries) {
    if (!e.loc.startsWith(`${ORIGIN}/`)) fail(`sitemap.xml: ${e.loc} nu e pe ${ORIGIN}`);
    const path = e.loc.slice(ORIGIN.length) || "/";
    if (classifyPath(path) !== "public") fail(`sitemap.xml: ${path} nu e o pagină publică (${classifyPath(path)})`);
    const t = e.lastmod ? Date.parse(e.lastmod) : NaN;
    if (!e.lastmod) fail(`sitemap.xml: ${e.loc} fără <lastmod>`);
    else if (Number.isNaN(t) || t > tomorrow) fail(`sitemap.xml: ${e.loc} are <lastmod> invalid: ${e.lastmod}`);
  }
}

// 3. fiecare pagină din sitemap: 200, canonical, indexabilă, titlu, descriere, un singur H1, og:image
const paths = entries.length ? entries.map((e) => e.loc.slice(ORIGIN.length) || "/") : expected;
const queue = [...paths];
await Promise.all(Array.from({ length: 4 }, async () => {
  for (let path = queue.shift(); path; path = queue.shift()) {
    const page = await getOk(path);
    if (!page) continue;
    const h = head(page.text);
    if (!h.canonical) fail(`${path}: lipsește canonical`);
    else if (new URL(h.canonical, ORIGIN).href !== new URL(path, ORIGIN).href) fail(`${path}: canonical ${h.canonical}`);
    if (h.robots.some((r) => /noindex/i.test(r))) fail(`${path}: noindex`);
    if (h.titles.length !== 1) fail(`${path}: ${h.titles.length} etichete <title>`);
    const title = h.titles[0] ?? "";
    if ([...title].length > 60) warn(`${path}: titlul are ${[...title].length} caractere (max 60): ${title}`);
    if (h.descriptions.length !== 1) fail(`${path}: ${h.descriptions.length} meta description`);
    const len = [...(h.descriptions[0] ?? "")].length;
    if (h.descriptions.length === 1 && (len < 140 || len > 155)) warn(`${path}: descrierea are ${len} caractere (140–155)`);
    if (h.h1 !== 1) fail(`${path}: ${h.h1} etichete <h1> (aștepta 1)`);
    if (!h.ogImage) fail(`${path}: lipsește og:image`);
    else if (!h.ogImage.startsWith(`${ORIGIN}/`)) fail(`${path}: og:image nu e absolut pe ${ORIGIN}: ${h.ogImage}`);
    if (path === "/") {
      if (!page.text.includes('"@type":"SoftwareApplication"')) fail("/: lipsește SoftwareApplication în JSON-LD");
      if (!page.text.includes('property="og:locale" content="ro_RO"')) fail("/: lipsește og:locale ro_RO");
    }
  }
}));

// 4. adrese inexistente: 404 cu noindex, nu redirecționare spre login
for (const path of [`/pagina-inexistenta-${Date.now().toString(36)}`, "/wp-admin", "/blog/articol-inexistent-verificare"]) {
  const response = await fetchRaw(path);
  if (response.status !== 404) {
    fail(`${path}: status ${response.status}${response.headers.get("location") ? ` → ${response.headers.get("location")}` : ""} (aștepta 404)`);
    continue;
  }
  const h = head(await response.text());
  if (!h.robots.some((r) => /noindex/i.test(r))) fail(`${path}: pagina 404 fără noindex`);
  if (!path.startsWith("/blog/") && !h.titles.some((t) => t.includes("Pagina nu există"))) fail(`${path}: pagina 404 nu e cea în română (titlu: ${h.titles.join(" / ")})`);
}

// 5. rutele aplicației cer cont: fără sesiune, redirecționare temporară spre login
for (const [path, to] of [["/dashboard", "/login"], ["/lucrari/oricare", "/login"], ["/admin", "/login"], ["/mobil", "/mobil-login"], ["/mobil/lucrari/oricare", "/mobil-login"], ["/api/activity", "/login"]]) {
  const response = await fetchRaw(path);
  const location = response.headers.get("location");
  if (response.status !== 307 || !location || new URL(location, base).pathname !== to) {
    fail(`${path}: status ${response.status}${location ? ` → ${location}` : ""} (aștepta 307 → ${to})`);
  }
}
const login = await getOk("/login");
if (login && !head(login.text).robots.some((r) => /noindex/i.test(r))) fail("/login: lipsește noindex");

// 6. fișiere publice
const llms = await getOk("/llms.txt");
if (llms) {
  if (!(llms.response.headers.get("content-type") ?? "").startsWith("text/plain")) fail(`/llms.txt: content-type ${llms.response.headers.get("content-type")}`);
  if (!llms.text.startsWith("# ElectroField")) fail("/llms.txt: nu începe cu „# ElectroField”");
}
const keyFile = (await readdir(new URL("public/", ROOT))).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) fail("public/: lipsește fișierul-cheie IndexNow");
else {
  const key = (await readFile(new URL(`public/${keyFile}`, ROOT), "utf8")).trim();
  const served = await getOk(`/${keyFile}`);
  if (served && served.text.trim() !== key) fail(`/${keyFile}: conținutul nu e cheia IndexNow`);
}
const css = await getOk("/blog-style.css");
if (css && !css.text.includes("{")) fail("/blog-style.css: nu pare CSS");

// 7. redirecționări
for (const [from, to, status] of [
  ["/blog/index.html", "/blog", 308],
  ["/blog/index", "/blog", 308],
  ["/blog/gestionare-echipe-de-teren.html", "/blog/gestionare-echipe-de-teren", 308],
  ["/programare.html", "/programare", 308],
  ["/blog/", "/blog", 308],
  ["/signup", "/programare", 307],
]) {
  const response = await fetchRaw(from);
  const location = response.headers.get("location");
  if (response.status !== status || !location || new URL(location, base).pathname !== to) {
    fail(`${from}: status ${response.status}${location ? ` → ${location}` : ""} (aștepta ${status} → ${to})`);
  }
}

for (const w of warnings) console.warn(`avertisment: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`eroare: ${e}`);
  console.error(`\nSEO: ${errors.length} erori, ${warnings.length} avertismente (${base}).`);
  process.exit(1);
}
console.log(`SEO: ok pe ${base}. ${entries.length} adrese în sitemap verificate (200, canonical, indexabile, un H1, og:image), 404 în română, rutele private cer cont, ${warnings.length} avertismente.`);
