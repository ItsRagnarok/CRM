"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const links = [
  { href: "/admin/facturare", label: "Acasă" },
  { href: "/admin/facturare/clienti", label: "Clienți" },
  { href: "/admin/facturare/setari", label: "Setări facturare" },
];
export function BillingNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Facturare"
      className="my-6 flex flex-wrap gap-2 border-b border-border pb-4"
    >
      {links.map(({ href, label }) => {
        const active =
          path === href ||
          (href !== "/admin/facturare" && path.startsWith(href + "/"));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${active ? "bg-purple text-white" : "bg-purple-soft text-purple hover:underline"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
