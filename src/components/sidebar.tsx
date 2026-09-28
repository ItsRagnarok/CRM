"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  UsersRound,
  MapPin,
  Package,
  Receipt,
  Clock,
  BarChart3,
  FileText,
  Settings,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clienti", label: "Clienți", icon: Users },
  { href: "/lucrari", label: "Lucrări", icon: Briefcase },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/echipe", label: "Echipe", icon: UsersRound },
  { href: "/harta", label: "Hartă & GPS", icon: MapPin },
  { href: "/materiale", label: "Materiale", icon: Package },
  { href: "/cheltuieli", label: "Cheltuieli", icon: Receipt },
  { href: "/pontaj", label: "Pontaj", icon: Clock },
  { href: "/rapoarte", label: "Rapoarte", icon: BarChart3 },
  { href: "/facturare", label: "Facturare", icon: FileText },
  { href: "/setari", label: "Setări", icon: Settings },
];

export function Sidebar({
  fullName,
  roleLabel,
}: {
  fullName: string;
  roleLabel: string;
}) {
  const pathname = usePathname();
  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="flex h-screen w-[236px] shrink-0 flex-col bg-navy px-3.5 py-5">
      <Link href="/dashboard" prefetch={false} className="flex items-center gap-2.5 px-2 pb-5 pt-1.5">
        {/* Placeholder mark — swap for the real logo file once provided */}
        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-electric to-amber">
          <Zap className="h-[18px] w-[18px] text-white" />
        </div>
        <div>
          <div className="text-[15px] font-bold tracking-tight text-white">
            ElectroField
          </div>
          <div className="text-[10.5px] text-[#9da0a8]">
            Echipă. Lucrări. Control.
          </div>
        </div>
      </Link>

      <nav className="mt-1.5 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className={`flex items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                isActive
                  ? "bg-navy-active font-semibold text-white"
                  : "text-[#b4b6be] hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 border-t border-navy-border px-2.5 pt-3">
        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-electric text-[13px] font-bold text-white">
          {initials || "?"}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-white">
            {fullName}
          </div>
          <div className="text-[11.5px] text-[#9da0a8]">{roleLabel}</div>
        </div>
      </div>
    </aside>
  );
}
