"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const PUBLIC_PATHS = new Set(["/", "/termeni", "/confidentialitate"]);

// Counts page views of the public site pages served by Next (the blog and booking pages load /ef-analytics.js directly).
export function SiteTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!PUBLIC_PATHS.has(pathname)) return;
    try {
      if (localStorage.getItem("ef-no-track") || navigator.doNotTrack === "1") return;
      const body = JSON.stringify({ path: pathname, referrer: document.referrer || "", utm: new URLSearchParams(location.search).get("utm_source") || "" });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/analytics", new Blob([body], { type: "text/plain" }));
      else void fetch("/api/analytics", { method: "POST", body, keepalive: true });
    } catch { /* analytics must never break the page */ }
  }, [pathname]);
  return null;
}
