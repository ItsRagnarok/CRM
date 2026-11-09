import Link from "next/link";
import { Logo } from "@/components/logo";
import { signOutAdmin } from "@/app/admin/actions";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/admin", label: "Prezentare generală" },
  { href: "/admin/companii", label: "Companii" },
  { href: "/admin/programari", label: "Programări" },
  { href: "/admin/activitate", label: "Activitate" },
  { href: "/admin/mail", label: "Mail" },
  { href: "/admin/solicitari", label: "Solicitări" },
  { href: "/admin/cont", label: "Cont" },
];

export function AdminTopbar({ fullName, upcomingBookings = 0, openRequests = 0 }: { fullName: string; upcomingBookings?: number; openRequests?: number }) {
  return (
    <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-graphite-border bg-graphite px-5 py-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2.5">
          <Logo size={28} className="text-white" />
          <span className="ml-1 rounded-full bg-purple/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-purple">
            Super Admin
          </span>
        </div>
        <nav className="flex w-full min-w-0 flex-nowrap items-center gap-1 overflow-x-auto md:w-auto md:flex-wrap md:overflow-visible" aria-label="Administrare platformă">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 whitespace-nowrap rounded-[8px] px-3 py-1.5 text-[13px] font-semibold text-[#c9c3e0] transition-colors hover:bg-graphite-active hover:text-white"
            >
              {item.label}
              {item.href === "/admin/programari" && upcomingBookings > 0 && (
                <span className="ml-1.5 rounded-full bg-purple px-1.5 py-0.5 text-[10.5px] font-bold text-white">{upcomingBookings}</span>
              )}
              {item.href === "/admin/solicitari" && openRequests > 0 && (
                <span className="ml-1.5 rounded-full bg-[#c6ff4a] px-1.5 py-0.5 text-[10.5px] font-bold text-[#0a0d0a]" title={`${openRequests} solicitări neprocesate`}>{openRequests}</span>
              )}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <span className="text-[13px] text-[#a39bc4]">{fullName}</span>
        <form action={signOutAdmin}>
          <button
            type="submit"
            className="rounded-[8px] border border-graphite-border px-3 py-1.5 text-[13px] font-medium text-[#c9c3e0] transition-colors hover:bg-graphite-active hover:text-white"
          >
            Deconectare
          </button>
        </form>
      </div>
    </header>
  );
}
