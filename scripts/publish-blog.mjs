// Publică un articol pregătit în content/blog-programat/:
//   node scripts/publish-blog.mjs <slug> [<slug> ...]
// - mută <slug>.html în public/blog/ (sitemap-ul îl preia automat, src/app/sitemap.ts);
// - adaugă cardul (din <slug>.card.json) primul în lista blogului (public/blog/index.html);
// - șterge fișierul .card.json.
import { readFile, writeFile, rename, rm, access } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const MARK = "<!-- ARTICOL NOU:";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const slugs = process.argv.slice(2);
if (!slugs.length) {
  console.error("Folosire: node scripts/publish-blog.mjs <slug> [...]");
  process.exit(1);
}

for (const slug of slugs) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Slug invalid: ${slug}`);
  const src = path.join(root, "content/blog-programat", `${slug}.html`);
  const cardFile = path.join(root, "content/blog-programat", `${slug}.card.json`);
  const dest = path.join(root, "public/blog", `${slug}.html`);
  await access(src);
  const card = JSON.parse(await readFile(cardFile, "utf8"));

  const indexPath = path.join(root, "public/blog/index.html");
  let index = await readFile(indexPath, "utf8");
  if (!index.includes(`href="/blog/${slug}"`)) {
    const at = index.indexOf(MARK);
    if (at < 0) throw new Error("Nu găsesc marcajul pentru articole noi în public/blog/index.html");
    const lineEnd = index.indexOf("\n", at) + 1;
    const html = `<a class="card" href="/blog/${slug}"><span class="tag">${esc(card.tag)}</span><h2>${esc(card.title)}</h2><p>${esc(card.excerpt)}</p></a>\n`;
    index = index.slice(0, lineEnd) + html + index.slice(lineEnd);
    await writeFile(indexPath, index);
  }
  await rename(src, dest);
  await rm(cardFile, { force: true });
  console.log(`Publicat: /blog/${slug}`);
}
