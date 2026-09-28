"use client";

import dynamic from "next/dynamic";
import type { MobileMapJob } from "@/components/mobile-map";

const MobileMap = dynamic(() => import("@/components/mobile-map").then((m) => m.MobileMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#f2f4f7] text-[13px] text-muted">
      Se încarcă harta…
    </div>
  ),
});

export function MobileMapLoader({ jobs, routeTo }: { jobs: MobileMapJob[]; routeTo?: MobileMapJob }) {
  return <MobileMap jobs={jobs} routeTo={routeTo} />;
}
