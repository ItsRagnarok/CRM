"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const PUBLIC_PATHS = new Set(["/", "/termeni", "/confidentialitate"]);

// Counts page views of the public site pages served by Next (the blog and booking pages load /ef-analytics.js directly).
export function SiteTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!PUBLIC_PATHS.has(pathname)) return;
    const send = (data: Record<string, unknown>) => {
      try {
        const body = JSON.stringify(data);
        if (navigator.sendBeacon) navigator.sendBeacon("/api/analytics", new Blob([body], { type: "text/plain" }));
        else void fetch("/api/analytics", { method: "POST", body, keepalive: true });
      } catch { /* analytics must never break the page */ }
    };
    try {
      if (localStorage.getItem("ef-no-track") || navigator.doNotTrack === "1") return;
    } catch { if (navigator.doNotTrack === "1") return; }
    send({ path: pathname, referrer: document.referrer || "", utm: new URLSearchParams(location.search).get("utm_source") || "", screen: `${Math.round(screen.width)}x${Math.round(screen.height)}`, lang: navigator.language || "" });
    // Cât timp a stat pe pagină: doar cât a fost vizibilă, trimis la plecare sau la schimbarea tabului.
    let visibleMs = 0;
    let since = document.visibilityState === "visible" ? Date.now() : 0;
    let sent = 0;
    const flush = () => {
      if (since) { visibleMs += Date.now() - since; since = 0; }
      const s = Math.round(visibleMs / 1000);
      if (s >= 2 && s > sent) { sent = s; send({ type: "time", path: pathname, seconds: s }); }
    };
    const onVis = () => { if (document.visibilityState === "hidden") flush(); else since = Date.now(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    return () => { flush(); document.removeEventListener("visibilitychange", onVis); window.removeEventListener("pagehide", flush); };
  }, [pathname]);
  return null;
}
