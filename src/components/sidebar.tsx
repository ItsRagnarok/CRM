"use client";

import Image from "next/image";
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
  LogOut,
  ClipboardCheck,
  MessageSquare,
} from "lucide-react";
import { signOut } from "@/app/(app)/actions";

// Grouped purely for legibility in the sidebar — no behavior/logic change,
// every href/icon/active-state check below is unchanged from the old flat
// list, just organized into sections instead of one undifferentiated block.
const NAV_SECTIONS: { label: string | null; items: { href: string; label: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    label: null,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/clienti", label: "Clienți", icon: Users },
    ],
  },
  {
    label: "Echipă & Lucrări",
    items: [
      { href: "/echipe", label: "Echipe", icon: UsersRound },
      { href: "/lucrari", label: "Lucrări", icon: Briefcase },
      { href: "/calendar", label: "Calendar", icon: Calendar },
    ],
  },
  {
    label: null,
    items: [
      { href: "/materiale", label: "Materiale și scule", icon: Package },
      { href: "/harta", label: "Hartă & GPS", icon: MapPin },
      { href: "/mesaje", label: "Mesaje", icon: MessageSquare },
    ],
  },
  {
    label: "Bani & Timp",
    items: [
      { href: "/cheltuieli", label: "Cheltuieli", icon: Receipt },
      { href: "/aprobari", label: "Aprobări", icon: ClipboardCheck },
      { href: "/pontaj", label: "Pontaj", icon: Clock },
      { href: "/rapoarte", label: "Rapoarte", icon: BarChart3 },
      { href: "/facturare", label: "Facturare", icon: FileText },
    ],
  },
  {
    label: null,
    items: [{ href: "/setari", label: "Setări", icon: Settings }],
  },
];

export function Sidebar({
  fullName,
  roleLabel,
  unreadMessages = 0,
}: {
  fullName: string;
  roleLabel: string;
  unreadMessages?: number;
}) {
  const pathname = usePathname();
  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="flex h-screen w-[236px] shrink-0 flex-col bg-navy px-3.5 py-2.5">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-2 pb-2 pt-0.5">
        <Image
          src="/logo-mark.png"
          alt="ElectroField"
          width={28}
          height={28}
          className="h-7 w-7 shrink-0 object-contain"
          priority
        />
        <div className="flex items-baseline text-[15px] font-bold tracking-tight text-white">
          Electro
          <Image
            src="/logo-wordmark-field.png"
            alt="Field"
            width={496}
            height={173}
            className="h-[15px] w-auto translate-y-[1px] object-contain"
          />
        </div>
      </Link>

      <nav className="mt-0.5 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
        {NAV_SECTIONS.map((section, i) => (
          <div key={section.label ?? `section-${i}`} className="flex flex-col gap-0.5">
            {section.label && (
              <div className="px-3 pb-0.5 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#6f727c]">
                {section.label}
              </div>
            )}
            {section.items.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 rounded-[9px] px-3 py-1.5 text-[13.5px] font-medium transition-colors ${
                    isActive
                      ? "bg-navy-active font-semibold text-white"
                      : "text-[#b4b6be] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
                  <span className="flex-1">{label}</span>
                  {href === "/mesaje" && unreadMessages > 0 && (
                    <span className="flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[9.5px] font-bold text-white">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 border-t border-navy-border px-2.5 pt-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-electric text-[13px] font-bold text-white">
          {initials || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-white">
            {fullName}
          </div>
          <div className="text-[11.5px] text-[#9da0a8]">{roleLabel}</div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[#9da0a8] hover:bg-white/5 hover:text-white"
            aria-label="Deconectare"
          >
            <LogOut className="h-[16px] w-[16px]" strokeWidth={1.9} />
          </button>
        </form>
      </div>
    </aside>
  );
}
