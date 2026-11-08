import Link from "next/link";
import { Zap } from "lucide-react";
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

export function AdminTopbar({ fullName }: { fullName: string }) {
  return (
    <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-graphite-border bg-graphite px-5 py-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-purple">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-[14.5px] font-bold tracking-tight text-white">
            ElectroField
          </span>
          <span className="ml-1 rounded-full bg-purple/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-purple">
            Super Admin
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-1" aria-label="Administrare platformă">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[8px] px-3 py-1.5 text-[13px] font-semibold text-[#c9c3e0] transition-colors hover:bg-graphite-active hover:text-white"
            >
              {item.label}
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
