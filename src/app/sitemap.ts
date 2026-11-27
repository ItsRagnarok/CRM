import type { MetadataRoute } from "next";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { SITE_URL } from "@/lib/seo";
import { MARKETING_PAGES } from "@/lib/marketing-pages";

export const dynamic = "force-static";

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
  const newest = articles.reduce<Date | undefined>((a, b) => (b.lastModified && (!a || b.lastModified > a) ? b.lastModified : a), undefined);

  return [
    { url: `${SITE_URL}/`, priority: 1 },
    ...MARKETING_PAGES.map((p) => ({ url: `${SITE_URL}/${p.slug}`, lastModified: new Date(p.updated), priority: 0.9 })),
    { url: `${SITE_URL}/blog`, lastModified: newest, priority: 0.8 },
    ...articles.map((a) => ({ ...a, priority: 0.7 })),
    { url: `${SITE_URL}/programare`, priority: 0.6 },
    { url: `${SITE_URL}/termeni`, priority: 0.2 },
    { url: `${SITE_URL}/confidentialitate`, priority: 0.2 },
  ];
}
