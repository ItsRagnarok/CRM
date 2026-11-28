// Accesul fără cont pe adrese (src/lib/route-access.ts, folosit de src/middleware.ts).
// (a) un tabel de adrese cunoscute; (b) parcurge src/app și pică dacă o rută nu e clasificată ca
// publică sau privată, ca o rută nouă să nu ajungă publică (sau să dea 404) fără să observe cineva.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifyPath, isSessionlessPath, loginPathFor, PRIVATE_PREFIXES, PUBLIC_PREFIXES, SIGNED_IN_ENTRY_PATHS, underPrefix,
} from "../src/lib/route-access";
import { MARKETING_SLUGS } from "../src/lib/marketing-pages";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP = path.join(ROOT, "src", "app");
const BLOG = path.join(ROOT, "public", "blog");

const PUBLIC = [
  "/", "/login", "/signup", "/auth/clear-preview", "/downloads/electrofield.apk", "/confidentialitate", "/termeni",
  "/blog", "/blog/gestionare-echipe-de-teren", "/blog/inexistent", "/programare", "/mobil-login", "/status/abc123",
  "/solicitare/abc123", "/despre", "/robots.txt", "/sitemap.xml", "/llms.txt", "/d40280e4de21e42ba69e38e8aaa74cdc.txt",
  ...MARKETING_SLUGS.map((slug) => `/${slug}`),
];
const PRIVATE = [
  "/dashboard", "/lucrari", "/lucrari/", "/lucrari/123", "/lucrari/123/editeaza", "/clienti/oferte-export",
  "/gaze/registru/export", "/pontaj/export", "/setari/utilizatori/1", "/rapoarte", "/luni",
  "/mobil", "/mobil/", "/mobil/lucrari/1/foto", "/mobil/confidentialitate", "/admin", "/admin/companii/1",
  "/start", "/fise-gaze/1", "/pv-lucrari-ascunse/1", "/pv-scule/1", "/rapoarte-lucrare/1", "/accepta-termeni",
  "/cont-suspendat", "/api/activity", "/api/admin/analytics", "/api/admin/preview-exit", "/api/programari",
  "/api/analytics", "/api/facturi/1/pdf", "/api/rapoarte-lucrare/1", "/api/usage", "/api/inexistent",
  // Forme ocolite: litere mari, codare, bare duble, segment de grup.
  "/LUCRARI", "/Dashboard/x", "/%6Cucrari", "/lucrari%2F1", "//lucrari", "/(app)/lucrari", "/mobil\\lucrari",
];
const NOT_FOUND = [
  "/pagina-inexistenta", "/wp-admin", "/wp-login.php", "/.env", "/lucrarix", "/blogfoo", "/blog-x", "/mobilfoo",
  "/mobil-loginx", "/statusx", "/despre-noi", "/rapoarte-lucrarex", "/apix", "/startup", "/software", "/a/b/c",
  "/firme-instalatii-electrice/x", "/preturi",
];

test("adrese publice", () => {
  for (const p of PUBLIC) assert.equal(classifyPath(p), "public", p);
});

test("adrese private (cer cont)", () => {
  for (const p of PRIVATE) assert.equal(classifyPath(p), "private", p);
});

test("adrese necunoscute: trec spre Next (404), nu spre login", () => {
  for (const p of NOT_FOUND) assert.equal(classifyPath(p), "notfound", p);
});

test("login-ul potrivit: /mobil... la /mobil-login, restul la /login", () => {
  for (const p of ["/mobil", "/mobil/", "/mobil/lucrari/1", "/MOBIL/pontaj"]) assert.equal(loginPathFor(p), "/mobil-login", p);
  for (const p of ["/dashboard", "/lucrari/1", "/admin", "/api/activity", "/mobilfoo"]) assert.equal(loginPathFor(p), "/login", p);
});

test("fișierele servite fără sesiune (potrivire exactă)", () => {
  for (const p of ["/llms.txt", "/robots.txt", "/sitemap.xml", "/d40280e4de21e42ba69e38e8aaa74cdc.txt", "/api/version", "/blog-style.css", "/sw.js", "/manifest.json"]) {
    assert.equal(isSessionlessPath(p), true, p);
  }
  for (const p of ["/llms.txt/x", "/blog", "/api/versions", "/api/activity", "/"]) assert.equal(isSessionlessPath(p), false, p);
});

test("potrivirea pe segmente", () => {
  assert.equal(underPrefix("/lucrari", "/lucrari"), true);
  assert.equal(underPrefix("/lucrari/x", "/lucrari"), true);
  assert.equal(underPrefix("/lucrarix", "/lucrari"), false);
});

test("listele nu se suprapun și paginile pe meserie nu calcă peste rute private", () => {
  for (const pub of PUBLIC_PREFIXES) assert.equal(classifyPath(pub), "public", `${pub} e și în lista privată`);
  for (const slug of MARKETING_SLUGS) assert.ok(!PRIVATE_PREFIXES.some((b) => underPrefix(`/${slug}`, b)), slug);
  for (const p of SIGNED_IN_ENTRY_PATHS) assert.equal(classifyPath(p), "public", p);
});

test("articolele din public/blog sunt publice", () => {
  for (const file of readdirSync(BLOG).filter((f) => f.endsWith(".html"))) {
    assert.equal(classifyPath(`/blog/${file.slice(0, -5)}`), "public", file);
  }
});

// --- (b) arborele de rute din src/app ---

const ROUTE_FILE = /^(page|route)\.(tsx|ts|jsx|js|mdx)$/;
const isGroup = (name: string) => /^\(.*\)$/.test(name) || name.startsWith("@");
const isDynamic = (name: string) => /^\[.*\]$/.test(name);
const isPrivateFolder = (name: string) => name.startsWith("_");

type Route = { file: string; segments: string[] };

/** Toate fișierele page/route din src/app, cu segmentele URL (grupurile și sloturile nu apar în URL). */
function routes(dir = APP, segments: string[] = []): Route[] {
  const out: Route[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      if (isPrivateFolder(name) || name === "node_modules") continue;
      out.push(...routes(full, isGroup(name) ? segments : [...segments, name]));
    } else if (ROUTE_FILE.test(name)) {
      out.push({ file: path.relative(ROOT, full), segments });
    }
  }
  return out;
}

/** Un URL concret pentru o rută: segmentele dinamice primesc o valoare de probă. */
function sampleUrl(segments: string[]): string {
  const parts = segments.flatMap((seg) => {
    if (/^\[\[\.\.\..+\]\]$/.test(seg)) return ["a", "b"];
    if (/^\[\.\.\..+\]$/.test(seg)) return ["a", "b"];
    if (isDynamic(seg)) return ["x1"];
    return [seg];
  });
  return `/${parts.join("/")}`;
}

const ALL_ROUTES = routes();

test("arborele de rute a fost citit", () => {
  assert.ok(ALL_ROUTES.length > 50, `doar ${ALL_ROUTES.length} rute găsite în src/app`);
  assert.ok(ALL_ROUTES.some((r) => r.file.includes(path.join("(app)", "lucrari"))), "grupul (app) lipsește din parcurgere");
});

test("fiecare folder de rută de pe primul nivel e clasificat public sau privat", () => {
  const top = new Map<string, Route[]>();
  for (const r of ALL_ROUTES) {
    const first = r.segments[0] ?? "";
    top.set(first, [...(top.get(first) ?? []), r]);
  }
  const problems: string[] = [];
  for (const [first, list] of top) {
    if (first === "") continue; // src/app/page.tsx: prima pagină
    if (isDynamic(first)) {
      // Singurul segment dinamic de pe primul nivel: [slug], paginile pe meserie, fără subrute.
      if (first !== "[slug]") {
        problems.push(`src/app/${first}: segment dinamic nou pe primul nivel; adresele lui ar trece de middleware fără clasificare`);
        continue;
      }
      if (list.some((r) => r.segments.length !== 1)) problems.push("src/app/[slug]: nu trebuie să aibă subrute");
      const page = list.find((r) => r.segments.length === 1);
      const source = page ? readFileSync(path.join(ROOT, page.file), "utf8") : "";
      if (!/export const dynamicParams = false/.test(source)) problems.push("src/app/[slug]: lipsește dynamicParams = false (doar slug-urile din MARKETING_PAGES există, restul dau 404)");
      continue;
    }
    if (classifyPath(`/${first}`) === "notfound") problems.push(`/${first} (${list[0].file}) nu e clasificată`);
  }
  assert.deepEqual(problems, [], `Adaugă rutele în PRIVATE_PREFIXES sau PUBLIC_PREFIXES din src/lib/route-access.ts:\n${problems.join("\n")}`);
});

test("fiecare rută din src/app are o clasă explicită (public sau privat)", () => {
  const unclassified = ALL_ROUTES
    .filter((r) => r.segments[0] !== "[slug]")
    .map((r) => ({ ...r, url: sampleUrl(r.segments) }))
    .filter((r) => classifyPath(r.url) === "notfound")
    .map((r) => `${r.url} (${r.file})`);
  assert.deepEqual(unclassified, [], unclassified.join("\n"));
});

test("rutele aplicației sunt private", () => {
  const mustBePrivate = ALL_ROUTES.filter((r) =>
    r.file.includes(`${path.sep}(app)${path.sep}`) ||
    ["admin", "mobil", "api", "start"].includes(r.segments[0] ?? ""));
  assert.ok(mustBePrivate.length > 40);
  for (const r of mustBePrivate) assert.equal(classifyPath(sampleUrl(r.segments)), "private", r.file);
});

test("middleware-ul folosește clasificarea", () => {
  const source = readFileSync(path.join(ROOT, "src", "middleware.ts"), "utf8");
  assert.match(source, /from "@\/lib\/route-access"/);
  assert.match(source, /classifyPath\(pathname\) === "private"/);
  assert.match(source, /isSessionlessPath\(pathname\)/);
  assert.doesNotMatch(source, /pathname\.startsWith\(path\)/, "potrivirea veche, fără segmente");
});
