"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  MapPin,
  Package,
  Clock,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  ShieldCheck,
  Flame,
  Sun,
  MessageSquare,
} from "lucide-react";
import { signOut } from "@/app/(app)/actions";

// Grouped purely for legibility in the sidebar — no behavior/logic change,
// every href/icon/active-state check below is unchanged from the old flat
// list, just organized into sections instead of one undifferentiated block.
type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; module?: string; also?: string[] };
// Same structure as the platform mockup: groups, names and order.
const NAV_SECTIONS: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [
      { href: "/dashboard", label: "Panou", icon: LayoutDashboard },
      { href: "/lucrari", label: "Lucrări", icon: Briefcase },
      { href: "/calendar", label: "Calendar și echipe", icon: Calendar, also: ["/echipe"] },
      { href: "/harta", label: "Hartă live", icon: MapPin },
    ],
  },
  {
    label: "Pe domenii",
    items: [
      { href: "/gaze", label: "Gaze · scadențar", icon: Flame, module: "scadentar_gaze" },
      { href: "/fotovoltaic", label: "Fotovoltaic · dosare", icon: Sun, module: "dosar_fotovoltaic" },
    ],
  },
  {
    label: "Clienți și bani",
    items: [
      { href: "/clienti", label: "Clienți", icon: Users },
      { href: "/facturare", label: "Facturare și încasări", icon: FileText },
    ],
  },
  {
    label: "Firmă",
    items: [
      { href: "/conformitate", label: "Conformitate", icon: ShieldCheck, module: "conformitate" },
      { href: "/materiale", label: "Stoc și mașini", icon: Package },
      { href: "/pontaj", label: "Pontaj și concedii", icon: Clock, also: ["/cheltuieli", "/aprobari"] },
      { href: "/rapoarte", label: "Rapoarte", icon: BarChart3 },
    ],
  },
  {
    label: "Comunicare",
    items: [{ href: "/mesaje", label: "Mesaje", icon: MessageSquare }],
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
  modules = [],
  badges = {},
}: {
  fullName: string;
  roleLabel: string;
  unreadMessages?: number;
  modules?: string[];
  badges?: Record<string, number>;
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
            {section.items.filter((item) => !item.module || modules.includes(item.module)).map(({ href, label, icon: Icon, also }) => {
              const isActive = [href, ...(also ?? [])].some((h) => pathname === h || pathname.startsWith(h + "/"));
              const count = href === "/mesaje" ? unreadMessages : (badges[href] ?? 0);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13.5px] font-semibold transition-colors ${
                    isActive ? "bg-[rgba(198,255,74,.14)] text-white" : "text-[#cbcdd4] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className={`h-[17px] w-[17px] ${isActive ? "text-[#c6ff4a]" : ""}`} strokeWidth={1.9} />
                  <span className="flex-1">{label}</span>
                  {count > 0 && (
                    <span className="flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#dc2626] px-1.5 text-[10.5px] font-extrabold text-white">
                      {count > 99 ? "99+" : count}
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
