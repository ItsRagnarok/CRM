import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    // Account pages must remain crawlable so crawlers can see their noindex metadata.
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
