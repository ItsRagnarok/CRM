import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";

// Run against a local production server: node scripts/check-seo.mjs [base-url]
const base = process.argv[2] || "http://localhost:3100";
const origin = "https://www.electrofield.ro";
async function get(path) {
  const response = await fetch(`${base}${path}`, { redirect: "manual" });
  assert.equal(response.status, 200, `${path} must be public and return 200`);
  return response.text();
}

const robots = await get("/robots.txt");
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
const sitemap = await get("/sitemap.xml");
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const articles = (await readdir(new URL("../public/blog/", import.meta.url)))
  .filter((file) => file.endsWith(".html") && file !== "index.html");
assert.equal(urls.length, articles.length + 5);
assert.equal(new Set(urls).size, urls.length);
for (const article of articles) {
  assert.ok(urls.includes(`${origin}/blog/${article.slice(0, -5)}`));
}
for (const privatePath of ["/login", "/signup", "/dashboard", "/admin", "/mobil"]) {
  assert.ok(!urls.includes(`${origin}${privatePath}`));
}
assert.ok((await get("/blog-style.css")).includes("{"));
await get("/sitemap-blog.xml");

for (const pathname of ["/", "/blog", "/programare", "/termeni", "/confidentialitate"]) {
  const html = await get(pathname);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  assert.ok(canonical, `${pathname}: canonical exists`);
  assert.equal(new URL(canonical[1]).href, new URL(pathname, origin).href, `${pathname}: canonical`);
  assert.ok(!/<meta name="robots" content="[^"]*noindex/.test(html), `${pathname}: indexable`);
  assert.ok(html.includes('name="description"'), `${pathname}: description`);
  if (pathname === "/") {
    assert.ok(html.includes('"@type":"SoftwareApplication"'));
    assert.ok(html.includes('property="og:locale" content="ro_RO"'));
  }
}
assert.ok((await get("/login")).includes('name="robots" content="noindex, nofollow"'));
for (const [from, to] of [
  ["/blog/index.html", "/blog"],
  ["/blog/index", "/blog"],
  ["/blog/gestionare-echipe-de-teren.html", "/blog/gestionare-echipe-de-teren"],
  ["/programare.html", "/programare"],
]) {
  const response = await fetch(`${base}${from}`, { redirect: "manual" });
  assert.equal(response.status, 308, `${from}: permanent redirect`);
  assert.equal(new URL(response.headers.get("location"), base).pathname, to);
  await get(to);
}
console.log(`SEO checks passed: ${urls.length} sitemap URLs, public metadata, login noindex, CSS and canonical redirects.`);
