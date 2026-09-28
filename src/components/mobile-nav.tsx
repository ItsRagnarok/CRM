"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, MapPin, Package, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/mobil", label: "Acasă", icon: Home },
  { href: "/mobil/lucrari", label: "Lucrări", icon: Briefcase },
  { href: "/mobil/harta", label: "Hartă", icon: MapPin },
  { href: "/mobil/materiale", label: "Materiale", icon: Package },
  { href: "/mobil/profil", label: "Profil", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-[70px] shrink-0 items-center justify-around border-t border-[#eaecf0] bg-white pb-2">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/mobil" ? pathname === "/mobil" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 ${isActive ? "text-electric" : "text-[#98a2b3]"}`}
          >
            <Icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.9} />
            <div className={`text-[10.5px] ${isActive ? "font-bold" : "font-semibold"}`}>{label}</div>
          </Link>
        );
      })}
    </nav>
  );
}
