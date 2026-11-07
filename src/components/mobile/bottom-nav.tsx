"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, ScanLine, MessageCircle, Menu } from "lucide-react";

const ITEMS = [
  { href: "/mobil", label: "Acasă", icon: Home },
  { href: "/mobil/lucrari", label: "Lucrări", icon: Briefcase },
  { href: "/mobil/scaneaza", label: "Scanează", icon: ScanLine, scan: true },
  { href: "/mobil/mesaje", label: "Mesaje", icon: MessageCircle },
  { href: "/mobil/meniu", label: "Meniu", icon: Menu },
] as const;

// Sections that belong to a tab even though their URL lives elsewhere.
const BELONGS_TO_MENU = ["/mobil/profil", "/mobil/materiale", "/mobil/documente", "/mobil/concediu", "/mobil/ajutor", "/mobil/confidentialitate", "/mobil/setari", "/mobil/pontaj", "/mobil/cheltuieli", "/mobil/facturi"];
const BELONGS_TO_JOBS = ["/mobil/harta"];
const BELONGS_TO_MESSAGES = ["/mobil/notificari"];

function activeHref(pathname: string): string {
  if (pathname === "/mobil") return "/mobil";
  if (BELONGS_TO_MENU.some((p) => pathname.startsWith(p))) return "/mobil/meniu";
  if (BELONGS_TO_JOBS.some((p) => pathname.startsWith(p))) return "/mobil/lucrari";
  if (BELONGS_TO_MESSAGES.some((p) => pathname.startsWith(p))) return "/mobil/mesaje";
  const match = ITEMS.filter((i) => i.href !== "/mobil").find((i) => pathname.startsWith(i.href));
  return match?.href ?? "";
}

export function BottomNav({ unreadMessages }: { unreadMessages: number }) {
  const pathname = usePathname();
  const active = activeHref(pathname);

  return (
    <nav className="m-nav" aria-label="Navigare principală">
      {ITEMS.map(({ href, label, icon: Icon, ...rest }) => {
        const isScan = "scan" in rest;
        return (
          <Link key={href} href={href} className={`m-nv ${isScan ? "scan" : ""} ${active === href ? "on" : ""}`}>
            {isScan ? (
              <span className="m-fab" aria-hidden="true">
                <Icon className="m-i" strokeWidth={2} />
              </span>
            ) : (
              <Icon className="m-i" strokeWidth={active === href ? 2.2 : 1.9} />
            )}
            {label}
            {href === "/mobil/mesaje" && unreadMessages > 0 && <span className="m-badge">{unreadMessages > 9 ? "9+" : unreadMessages}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
