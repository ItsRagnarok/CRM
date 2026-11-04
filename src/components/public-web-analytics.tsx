"use client";

import { Analytics } from "@vercel/analytics/next";
import { usePathname } from "next/navigation";

const publicPaths = new Set(["/", "/termeni", "/confidentialitate"]);

export function PublicWebAnalytics() {
  const pathname = usePathname();
  if (!publicPaths.has(pathname)) return null;

  return <Analytics beforeSend={(event) => {
    const url = new URL(event.url, window.location.origin);
    if (!publicPaths.has(url.pathname)) return null;
    url.search = "";
    url.hash = "";
    return { ...event, url: url.toString() };
  }} />;
}
