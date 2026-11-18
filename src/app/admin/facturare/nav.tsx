"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Plus, Users, BarChart3, Settings } from "lucide-react";
const links = [
  ["", "Acasă", Home],
  ["/facturi", "Facturi", FileText],
  ["/clienti", "Clienți", Users],
  ["/rapoarte", "Rapoarte", BarChart3],
  ["/setari", "Setări", Settings],
] as const;
export function BillingNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Facturare"
      className="mb-7 flex items-center gap-1 overflow-x-auto rounded-2xl border border-border bg-white p-2 shadow-sm"
    >
      {links.map(([href, label, Icon]) => {
        const target = "/admin/facturare" + href;
        const active = href ? path.startsWith(target) : path === target;
        return (
          <Link
            key={href}
            href={target}
            aria-current={active ? "page" : undefined}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] sm:px-3 font-semibold sm:flex-row sm:gap-2 sm:text-sm ${active ? "bg-purple-soft text-purple" : "text-muted hover:bg-purple-soft"}`}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
      <Link
        href="/admin/facturare/facturi/noua"
        aria-label="Factură nouă"
        className="ml-1 rounded-full bg-purple p-3 text-white"
      >
        <Plus size={22} />
      </Link>
    </nav>
  );
}
