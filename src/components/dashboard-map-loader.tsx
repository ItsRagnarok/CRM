"use client";

import dynamic from "next/dynamic";
import type { DashboardMapJob } from "@/components/dashboard-map";

// Leaflet touches `window` at import time, so it must never run during SSR.
const DashboardMap = dynamic(() => import("@/components/dashboard-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-[13px] bg-[#f2f4f7] text-[13px] text-muted">
      Se încarcă harta…
    </div>
  ),
});

export function DashboardMapLoader({ jobs }: { jobs: DashboardMapJob[] }) {
  return <DashboardMap jobs={jobs} />;
}
