"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Silently re-fetches the current page's server data on an interval, so
// screens showing live status (team locations, job progress) stay current
// without the admin needing to hit reload. Pauses while the tab is hidden
// so it doesn't keep hitting the database from background tabs.
export function AutoRefresh({ intervalMs = 20_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
