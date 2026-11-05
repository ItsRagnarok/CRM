"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function AdminViewport({ topbar, banner, children }: { topbar: ReactNode; banner: ReactNode; children: ReactNode }) {
  const mail = usePathname() === "/admin/mail";
  return <div className={`ef-app-theme flex flex-col bg-[#f4f3f9] ${mail ? "admin-mail-viewport" : "min-h-screen"}`} data-mail-viewport={mail ? "true" : undefined}>
    {topbar}{banner}<main className={mail ? "min-h-0 flex-1 overflow-hidden" : "flex-1"}>{children}</main>
  </div>;
}
