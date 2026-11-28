import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { inlineLinkKind, inlineLinkTargets, parseInlineLinks, stripInlineLinks } from "../src/lib/inline-links";
import { breadcrumbName, formatRoDate, MARKETING_PAGES, MARKETING_SLUGS, marketingPage, ogImagePath, type MarketingPage } from "../src/lib/marketing-pages";
import { organizationJsonLd, publicPageMetadata, SITE_DESCRIPTION, softwareJsonLd, websiteJsonLd } from "../src/lib/seo";

const ROOT = new URL("../", import.meta.url);
const BLOG_SLUGS = readdirSync(new URL("public/blog/", ROOT)).filter((f) => f.endsWith(".html") && f !== "index.html").map((f) => f.slice(0, -5));
/** Articole noi, scrise în aceeași etapă cu paginile: legăturile spre ele sunt permise înainte să apară fișierul. */
const NEW_BLOG_SLUGS = ["model-foaie-de-parcurs", "autorizatie-anre-electrician", "priza-de-pamant-valori-masurare"];
const PUBLIC_PATHS = new Set([
  "/", "/blog", "/programare", "/termeni", "/confidentialitate",
  ...MARKETING_SLUGS.map((s) => `/${s}`),
  ...[...BLOG_SLUGS, ...NEW_BLOG_SLUGS].map((s) => `/blog/${s}`),
]);

/** Toate șirurile afișate ale unei pagini (unde pot apărea legături). */
function displayedStrings(page: MarketingPage): string[] {
  const out = [page.lead];
  for (const sec of page.sections) {
    if (sec.answer) out.push(sec.answer);
    out.push(...(sec.p ?? []), ...(sec.list ?? []));
    for (const b of sec.blocks ?? []) {
      if (b.type === "p") out.push(b.text);
      else if (b.type === "list" || b.type === "steps") out.push(...b.items);
      else if (b.type === "table") out.push(...(b.caption ? [b.caption] : []), ...b.head, ...b.rows.flat());
      else out.push(...(b.title ? [b.title] : []), b.text);
    }
  }
  for (const f of page.faq) out.push(f.q, f.a);
  return out;
}
const allText = (page: MarketingPage) => [page.title, page.description, page.kicker, page.h1, ...page.sections.map((s) => s.h), ...displayedStrings(page)].join("\n");

test("legături în text: bucăți și tipuri", () => {
  assert.deepEqual(parseInlineLinks("Fără legături."), [{ text: "Fără legături." }]);
  assert.deepEqual(parseInlineLinks(""), [{ text: "" }]);
  assert.deepEqual(parseInlineLinks("Vezi [pontajul din teren](/pontaj-tehnicieni) și [ghidul](/blog/gestionare-echipe-de-teren)."), [
    { text: "Vezi " },
    { text: "pontajul din teren", href: "/pontaj-tehnicieni", kind: "page" },
    { text: " și " },
    { text: "ghidul", href: "/blog/gestionare-echipe-de-teren", kind: "static" },
    { text: "." },
  ]);
  assert.deepEqual(parseInlineLinks("[Programează o discuție](/programare)"), [{ text: "Programează o discuție", href: "/programare", kind: "static" }]);
  assert.deepEqual(parseInlineLinks("[a](/despre)[b](/)"), [{ text: "a", href: "/despre", kind: "page" }, { text: "b", href: "/", kind: "page" }]);
  assert.equal(inlineLinkKind("/blog"), "static");
  assert.equal(inlineLinkKind("/blog#articole"), "static");
  assert.equal(inlineLinkKind("/programare?sursa=gaze"), "static");
  assert.equal(inlineLinkKind("/downloads/electrofield.apk"), "static");
  assert.equal(inlineLinkKind("/og/despre.jpg"), "static");
  assert.equal(inlineLinkKind("/blogul-nostru"), "page");
  assert.equal(inlineLinkKind("/firme-gaze-verificari-revizii#scadentar"), "page");
  assert.equal(inlineLinkKind("#scadentar"), "anchor");
  assert.equal(inlineLinkKind("https://legislatie.just.ro/Public/DetaliiDocument/123"), "external");
  assert.equal(inlineLinkKind("mailto:contact@electrofield.ro"), "contact");
  assert.equal(inlineLinkKind("tel:+40750425670"), "contact");
  for (const bad of ["//evil.example", "/\\evil", "http://anre.ro", "javascript:alert(1)", "ftp://x.ro", "pagina", "https://", "data:text/html,x"]) {
    assert.equal(inlineLinkKind(bad), null, bad);
  }
});

test("legături în text: ținte nevalide și sintaxă incompletă rămân text", () => {
  const raw = "Nu e legătură: [x](javascript:alert(1)) sau [y](//evil.example) sau [z] (/despre) sau [](/despre).";
  assert.deepEqual(parseInlineLinks(raw), [{ text: raw }]);
  assert.equal(stripInlineLinks(raw), raw);
  assert.deepEqual(parseInlineLinks("Paranteze [simple] și [legătură](/despre)"), [
    { text: "Paranteze [simple] și " },
    { text: "legătură", href: "/despre", kind: "page" },
  ]);
});

test("legături în text: JSON-LD primește doar textul", () => {
  assert.equal(stripInlineLinks("Citește [ghidul fișei de evidență](/blog/fisa-evidenta-verificare-revizie-gaze-scadentar) înainte."), "Citește ghidul fișei de evidență înainte.");
  assert.equal(stripInlineLinks("Sursa: [Ord. ANRE 179/2015](https://www.anre.ro/)."), "Sursa: Ord. ANRE 179/2015.");
  assert.deepEqual(inlineLinkTargets("[a](/despre) [b](#x) [c](nu)"), [{ href: "/despre", kind: "page" }, { href: "#x", kind: "anchor" }]);
});

test("data în română", () => {
  assert.equal(formatRoDate("2026-11-28"), "28 noiembrie 2026");
  assert.equal(formatRoDate("2027-01-05"), "5 ianuarie 2027");
  assert.equal(formatRoDate("2026-13-01"), "2026-13-01");
  assert.equal(formatRoDate("28.11.2026"), "28.11.2026");
});

test("lista paginilor: ordinea, slug-urile și pagina Despre", () => {
  assert.deepEqual(MARKETING_SLUGS, MARKETING_PAGES.map((p) => p.slug));
  assert.equal(new Set(MARKETING_SLUGS).size, MARKETING_SLUGS.length);
  assert.equal(MARKETING_SLUGS[0], "software-management-echipe-teren");
  assert.equal(MARKETING_SLUGS.at(-1), "despre");
  assert.equal(marketingPage("despre")?.slug, "despre");
  assert.equal(marketingPage("nu-exista"), undefined);
});

test("fiecare pagină: câmpuri, imagine, legături interne valide", () => {
  for (const page of MARKETING_PAGES) {
    const at = page.slug;
    assert.match(page.slug, /^[a-z0-9-]+$/, at);
    assert.ok(page.title.length <= 60, `${at}: titlul are ${page.title.length} caractere (max 60)`);
    assert.ok(page.h1 && page.lead && page.kicker, `${at}: h1, lead, kicker`);
    assert.ok(page.sections.length > 0 && page.faq.length > 0, `${at}: secțiuni și FAQ`);
    assert.match(page.updated, /^\d{4}-\d{2}-\d{2}$/, `${at}: updated`);
    assert.notEqual(formatRoDate(page.updated), page.updated, `${at}: updated e o dată reală`);
    assert.equal(ogImagePath(page), `/og/${page.slug}.jpg`, `${at}: ogImage`);
    assert.ok(breadcrumbName(page).length > 0 && breadcrumbName(page).length <= 40, `${at}: breadcrumb scurt`);
    const ids = page.sections.flatMap((s) => (s.id ? [s.id] : []));
    for (const id of ids) assert.match(id, /^[a-z0-9-]+$/, `${at}: id ${id}`);
    assert.equal(new Set(ids).size, ids.length, `${at}: id-uri unice`);
    for (const s of page.sections) {
      for (const b of s.blocks ?? []) {
        if (b.type === "table") for (const row of b.rows) assert.equal(row.length, b.head.length, `${at}: rând de tabel cu ${row.length} celule în loc de ${b.head.length}`);
      }
    }
    for (const text of displayedStrings(page)) {
      for (const { href, kind } of inlineLinkTargets(text)) {
        if (kind !== "page" && kind !== "static") continue;
        const [pathname, hash] = href.split("#");
        assert.ok(PUBLIC_PATHS.has(pathname), `${at}: legătură spre o pagină care nu există: ${href}`);
        if (hash && pathname === `/${page.slug}`) assert.ok(ids.includes(hash), `${at}: ancora #${hash} lipsește`);
      }
      for (const { href, kind } of inlineLinkTargets(text)) {
        if (kind === "anchor") assert.ok(ids.includes(href.slice(1)), `${at}: ancora ${href} lipsește`);
      }
    }
    for (const slug of page.related) {
      assert.ok(BLOG_SLUGS.includes(slug) || NEW_BLOG_SLUGS.includes(slug), `${at}: articol legat inexistent: ${slug}`);
    }
    if (!(page.description.length >= 140 && page.description.length <= 155)) {
      console.warn(`atenție ${at}: descrierea are ${page.description.length} caractere (ținta e 140–155)`);
    }
  }
});

test("decizii fixe: fără prețuri și fără nume de concurenți în pagini", () => {
  const competitors = /\b(GoManager|Aktio|Electrogest|WorkApp|Om Pe Teren|CrewHub|Zarina|Softimpera|Bento|Odoo|Softlead|Wizrom|TisControl)\b/i;
  const prices = /\b\d[\d.]*\s*(lei|ron|€|eur)\b|\blei\s*\/\s*lun/i;
  for (const page of MARKETING_PAGES) {
    const text = allText(page);
    assert.doesNotMatch(text, competitors, `${page.slug}: nume de concurent`);
    assert.doesNotMatch(text, prices, `${page.slug}: preț`);
  }
});

test("SEO: metadate și JSON-LD comun", () => {
  assert.ok(SITE_DESCRIPTION.length <= 155, `SITE_DESCRIPTION are ${SITE_DESCRIPTION.length} caractere`);
  assert.doesNotMatch(SITE_DESCRIPTION, /ANRE/);

  const meta = publicPageMetadata("Titlu", "Descriere", "/despre", { ogImage: "/og/despre.jpg", ogAlt: "Despre", type: "article" });
  assert.deepEqual(meta.alternates, { canonical: "https://www.electrofield.ro/despre" });
  const og = meta.openGraph as { type: string; images: { url: string; alt: string }[] };
  assert.equal(og.type, "article");
  assert.equal(og.images[0].url, "https://www.electrofield.ro/og/despre.jpg");
  assert.equal(og.images[0].alt, "Despre");
  const def = publicPageMetadata("Titlu", "Descriere", "/").openGraph as { type: string; images: { url: string }[] };
  assert.equal(def.type, "website");
  assert.equal(def.images[0].url, "https://www.electrofield.ro/marketing/og-van-dusk.jpg");

  const org = organizationJsonLd();
  assert.equal(org["@id"], "https://www.electrofield.ro/#organization");
  assert.equal(org.taxID, "55851462");
  assert.ok(!("sameAs" in org) && !("legalName" in org) && !("founder" in org));
  const sw = softwareJsonLd();
  assert.equal(sw["@id"], "https://www.electrofield.ro/#software");
  assert.equal(sw.operatingSystem, "Web, Android");
  assert.ok(!("offers" in sw) && !("aggregateRating" in sw) && !("review" in sw));
  assert.doesNotMatch(sw.featureList.join(" "), /App Store|Google Play|PRAM|buletin|aplicație iPhone/i);
  assert.deepEqual(websiteJsonLd().publisher, { "@id": "https://www.electrofield.ro/#organization" });
  assert.ok(existsSync(new URL("public/icon-512.png", ROOT)));
});
