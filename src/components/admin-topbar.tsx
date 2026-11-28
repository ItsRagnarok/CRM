"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { signOutAdmin } from "@/app/admin/actions";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/admin", label: "Prezentare generală" },
  { href: "/admin/companii", label: "Companii" },
  { href: "/admin/programari", label: "Programări" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/proiecte", label: "Proiecte" },
  { href: "/admin/analitice", label: "Analitice" },
  { href: "/admin/activitate", label: "Activitate" },
  { href: "/admin/mail", label: "Mail" },
  { href: "/admin/solicitari", label: "Solicitări" },
  { href: "/admin/cont", label: "Cont" },
];

const isActive = (pathname: string, href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));

export function AdminTopbar({ fullName, upcomingBookings = 0, openRequests = 0, dueLeads = 0, dueTasks = 0 }: { fullName: string; upcomingBookings?: number; openRequests?: number; dueLeads?: number; dueTasks?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Meniul se închide după navigare, cu Escape, și blochează derularea paginii cât e deschis.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  const badge = (href: string) => {
    const n = href === "/admin/programari" ? upcomingBookings : href === "/admin/leads" ? dueLeads : href === "/admin/solicitari" ? openRequests : href === "/admin/proiecte" ? dueTasks : 0;
    if (!n) return null;
    const title = href === "/admin/leads" ? `${n} leaduri de reluat azi sau întârziate` : href === "/admin/solicitari" ? `${n} solicitări neprocesate` : href === "/admin/proiecte" ? `${n} sarcini de azi sau întârziate` : `${n} programări viitoare`;
    const tone = href === "/admin/programari" ? "bg-[#e5e5e5] text-[#0a0a0a]" : "bg-[#c6ff4a] text-[#0a0d0a]";
    return <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold ${tone}`} title={title}>{n}</span>;
  };

  const alerts = dueLeads + openRequests + dueTasks;

  return (
    <header className="shrink-0 border-b border-graphite-border bg-graphite pt-[env(safe-area-inset-top)]">
      <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2.5 md:min-h-16 md:px-5 md:py-3">
        <div className="flex min-w-0 items-center gap-2.5 md:gap-4">
          <Link href="/admin" aria-label="Prezentare generală" className="flex shrink-0 items-center"><Logo size={26} className="text-white" /></Link>
          <span className="hidden rounded-full border border-graphite-border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#d4d4d4] sm:inline">Super Admin</span>
          <nav className="hidden min-w-0 items-center gap-1 md:flex md:flex-wrap" aria-label="Administrare platformă">
            {NAV.map((item) => {
              const on = isActive(pathname, item.href);
              return (
                <Link key={item.href} href={item.href} aria-current={on ? "page" : undefined}
                  className={`shrink-0 whitespace-nowrap rounded-[8px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${on ? "bg-graphite-active text-white" : "text-[#a3a3a3] hover:bg-graphite-active hover:text-white"}`}>
                  {item.label}{badge(item.href)}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <ThemeToggle />
          <span className="text-[13px] text-[#a3a3a3]">{fullName}</span>
          <form action={signOutAdmin}>
            <button type="submit" className="rounded-[8px] border border-graphite-border px-3 py-1.5 text-[13px] font-medium text-[#a3a3a3] transition-colors hover:bg-graphite-active hover:text-white">Deconectare</button>
          </form>
        </div>

        <button type="button" onClick={() => setOpen(true)} aria-label="Deschide meniul" aria-expanded={open} aria-controls="admin-menu"
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-graphite-border text-white md:hidden">
          <Menu className="h-5 w-5" />
          {alerts > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#c6ff4a]" aria-hidden="true" />}
        </button>
      </div>

      {open && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}
      <div id="admin-menu" role="dialog" aria-modal="true" aria-label="Meniu administrare" hidden={!open}
        className="fixed inset-y-0 right-0 z-50 flex w-[300px] max-w-[88vw] flex-col bg-graphite pt-[env(safe-area-inset-top)] shadow-2xl md:hidden">
        <div className="flex min-h-14 items-center justify-between border-b border-graphite-border px-4">
          <span className="rounded-full border border-graphite-border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#d4d4d4]">Super Admin</span>
          <button type="button" onClick={() => setOpen(false)} aria-label="Închide meniul" className="flex h-11 w-11 items-center justify-center rounded-[10px] text-white"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Administrare platformă">
          {NAV.map((item) => {
            const on = isActive(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} aria-current={on ? "page" : undefined}
                className={`flex min-h-12 items-center justify-between rounded-[12px] px-3.5 text-[15px] font-semibold ${on ? "bg-graphite-active text-white" : "text-[#a3a3a3]"}`}>
                <span>{item.label}</span>{badge(item.href)}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col gap-3 border-t border-graphite-border px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-[14px] text-[#a3a3a3]">{fullName}</span>
            <ThemeToggle />
          </div>
          <form action={signOutAdmin}>
            <button type="submit" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-graphite-border text-[14px] font-medium text-[#a3a3a3]"><LogOut className="h-4 w-4" /> Deconectare</button>
          </form>
        </div>
      </div>
    </header>
  );
}
