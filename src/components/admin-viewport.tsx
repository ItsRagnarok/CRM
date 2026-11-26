"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function AdminViewport({ topbar, banner, children }: { topbar: ReactNode; banner: ReactNode; children: ReactNode }) {
  const mail = usePathname() === "/admin/mail";
  // overflow-x-clip: o pagină mai lată decât ecranul nu mai împinge bara de sus în lateral pe telefon.
  return <div className="ef-app-theme flex w-full max-w-full flex-col overflow-x-clip bg-[#f4f3f9]" data-mail-viewport={mail ? "true" : undefined} style={mail ? { height: "100dvh", minHeight: 0, overflow: "hidden" } : { minHeight: "100dvh" }}>
    {topbar}{banner}<main className={mail ? "min-h-0 flex-1 overflow-hidden" : "min-w-0 flex-1 pb-[max(4rem,env(safe-area-inset-bottom))] md:pb-0"}>{children}</main>
  </div>;
}
