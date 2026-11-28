import type { MetadataRoute } from "next";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { SITE_URL } from "@/lib/seo";
import { MARKETING_PAGES } from "@/lib/marketing-pages";

export const dynamic = "force-static";

/**
 * Data ultimei modificări reale a textului paginilor care nu au o dată în date (YYYY-MM-DD).
 * Pe Vercel nu există istoricul git la build, deci sunt constante: actualizează-le când se schimbă
 * textul paginii (data din `git log -1 --format=%cI -- <fișier>`).
 */
const PAGE_UPDATED = {
  home: "2026-11-28", // src/app/page.tsx, src/components/marketing/*
  programare: "2026-11-27", // public/programare.html
  termeni: "2026-11-27", // src/app/termeni/page.tsx, src/components/terms-content.tsx, src/lib/contact.ts
  confidentialitate: "2026-11-27", // src/app/confidentialitate/page.tsx, src/lib/contact.ts
};

const newest = (dates: (Date | undefined)[]) =>
  dates.reduce<Date | undefined>((a, b) => (b && (!a || b > a) ? b : a), undefined);

/** Data ultimei modificări a unui articol, din datele lui structurate (dateModified, altfel datePublished). */
function articleDate(html: string): Date | undefined {
  const m = /"dateModified"\s*:\s*"([^"]+)"/.exec(html) ?? /"datePublished"\s*:\s*"([^"]+)"/.exec(html);
  const d = m ? new Date(m[1]) : undefined;
  return d && !Number.isNaN(d.getTime()) ? d : undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dir = path.join(process.cwd(), "public", "blog");
  const files = (await readdir(dir)).filter((file) => file.endsWith(".html") && file !== "index.html").sort();
  const articles = await Promise.all(files.map(async (file) => ({
    url: `${SITE_URL}/blog/${file.slice(0, -5)}`,
    lastModified: articleDate(await readFile(path.join(dir, file), "utf8")),
  })));
  const marketing = MARKETING_PAGES.map((p) => ({ url: `${SITE_URL}/${p.slug}`, lastModified: new Date(p.updated) }));
  // Prima pagină leagă paginile pe meserie: data ei e cea mai nouă dintre ea și ele.
  const home = newest([new Date(PAGE_UPDATED.home), ...marketing.map((m) => m.lastModified)]);

  return [
    { url: `${SITE_URL}/`, lastModified: home, priority: 1 },
    ...marketing.map((m) => ({ ...m, priority: 0.9 })),
    { url: `${SITE_URL}/blog`, lastModified: newest(articles.map((a) => a.lastModified)), priority: 0.8 },
    ...articles.map((a) => ({ ...a, priority: 0.7 })),
    { url: `${SITE_URL}/programare`, lastModified: new Date(PAGE_UPDATED.programare), priority: 0.6 },
    { url: `${SITE_URL}/termeni`, lastModified: new Date(PAGE_UPDATED.termeni), priority: 0.2 },
    { url: `${SITE_URL}/confidentialitate`, lastModified: new Date(PAGE_UPDATED.confidentialitate), priority: 0.2 },
  ];
}
