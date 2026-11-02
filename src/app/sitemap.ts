import type { MetadataRoute } from "next";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = (await readdir(path.join(process.cwd(), "public", "blog")))
    .filter((file) => file.endsWith(".html") && file !== "index.html")
    .sort()
    .map((file) => `/blog/${file.slice(0, -5)}`);

  return ["/", "/blog", "/programare", "/termeni", "/confidentialitate", ...articles]
    .map((pathname) => ({ url: `${SITE_URL}${pathname}` }));
}
