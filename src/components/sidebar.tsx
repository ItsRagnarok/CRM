"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { HardHat,
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
  Zap,
  MessageSquare,
  Inbox,
  X,
  Gauge,
  Lock,
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
      { href: "/luni", label: "Luni dimineața", icon: Gauge },
      { href: "/cereri", label: "Cereri noi", icon: Inbox },
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
      { href: "/electric", label: "Electric · lucrări", icon: Zap, module: "buletine_electrice" },
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
      { href: "/ssm", label: "SSM", icon: HardHat },
      { href: "/materiale", label: "Stoc și mașini", icon: Package, also: ["/aprobari", "/foaie-parcurs"] },
      { href: "/pontaj", label: "Pontaj și concedii", icon: Clock, also: ["/cheltuieli"] },
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

// On phones the sidebar is an off-canvas drawer; the topbar's menu button
// opens it by dispatching this event (no shared state needed between them).
export const OPEN_MENU_EVENT = "ef:open-menu";

export function Sidebar({
  fullName,
  roleLabel,
  unreadMessages = 0,
  modules = [],
  badges = {},
  locked = [],
}: {
  fullName: string;
  roleLabel: string;
  unreadMessages?: number;
  modules?: string[];
  badges?: Record<string, number>;
  /** Cont demo: rutele blocate (rămân în meniu, cu lacăt). */
  locked?: string[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_MENU_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_MENU_EVENT, onOpen);
  }, []);
  // Close the drawer after navigating.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
    {open && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-dvh overflow-hidden w-[264px] max-w-[85vw] shrink-0 flex-col bg-navy px-3.5 py-2.5 transition-transform duration-200 md:relative md:z-auto md:w-[236px] md:max-w-none md:translate-x-0 md:transition-none ${
        open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      }`}
      aria-label="Meniu principal"
    >
      <div className="relative z-10 flex items-center">
      <Link href="/dashboard" className="flex flex-1 items-center gap-2.5 px-2 pb-2 pt-0.5">
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
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-[10px] text-[#cbcdd4] hover:bg-white/5 md:hidden"
        aria-label="Închide meniul"
      >
        <X className="h-5 w-5" strokeWidth={1.9} />
      </button>
      </div>

      <nav className="relative z-10 mt-0.5 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
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
              const isLocked = locked.includes(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13.5px] font-semibold transition-colors ${
                    isActive ? "bg-electric text-[#0a0d0a] shadow-[0_6px_18px_rgba(198,255,74,.18)]" : "text-[#cbcdd4] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-[17px] w-[17px]" strokeWidth={isActive ? 2.1 : 1.9} />
                  <span className="flex-1">{label}</span>
                  {isLocked ? <Lock className={`h-3.5 w-3.5 ${isActive ? "" : "text-[#6f727c]"}`} aria-label="se configurează pe firma ta" /> : count > 0 && (
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

      <SidebarStreak />

      <div className="relative z-10 mt-auto flex items-center gap-2.5 border-t border-white/[.08] px-2.5 pt-2.5">
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
    </>
  );
}

/**
 * Dunga verde din colțul de jos al meniului: o lumină lată și difuză, ondulată (coboară, apoi urcă spre
 * dreapta) și se stinge în întuneric, cu o margine luminoasă moale. Pur decorativă: stă în spatele
 * meniului, deasupra cardului cu numele, și nu prinde clicuri.
 */
function SidebarStreak() {
  const id = useId().replace(/:/g, "");
  const curve = "M-10 172 C 30 198, 80 206, 125 174 S 195 104, 250 116";
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-[52px] z-0 h-[210px] w-full"
      viewBox="0 0 240 210"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9be22d" stopOpacity="0.75" />
          <stop offset="0.5" stopColor="#4d7c0f" stopOpacity="0.3" />
          <stop offset="1" stopColor="#17191a" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-h`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#333" />
          <stop offset="0.3" stopColor="#888" />
          <stop offset="0.6" stopColor="#fff" />
          <stop offset="1" stopColor="#bbb" />
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="-40" y="0" width="320" height="210">
          <rect width="240" height="210" fill={`url(#${id}-h)`} />
        </mask>
        <linearGradient id={`${id}-e`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c6ff4a" stopOpacity="0" />
          <stop offset="0.45" stopColor="#d4ff7a" stopOpacity="0.55" />
          <stop offset="0.75" stopColor="#e6ffa8" stopOpacity="0.8" />
          <stop offset="1" stopColor="#c6ff4a" stopOpacity="0.35" />
        </linearGradient>
        <filter id={`${id}-b1`} filterUnits="userSpaceOnUse" x="-40" y="0" width="320" height="210"><feGaussianBlur stdDeviation="12" /></filter>
        <filter id={`${id}-b2`} filterUnits="userSpaceOnUse" x="-40" y="0" width="320" height="210"><feGaussianBlur stdDeviation="3" /></filter>
        <filter id={`${id}-b3`} filterUnits="userSpaceOnUse" x="-40" y="0" width="320" height="210"><feGaussianBlur stdDeviation="1.1" /></filter>
      </defs>
      <g mask={`url(#${id}-m)`}>
        <path d={`${curve} L 250 210 L -10 210 Z`} fill={`url(#${id}-f)`} filter={`url(#${id}-b1)`} />
        <path d={curve} fill="none" stroke="#b5f23c" strokeOpacity="0.45" strokeWidth="10" filter={`url(#${id}-b2)`} />
        <path d={curve} fill="none" stroke={`url(#${id}-e)`} strokeWidth="2" filter={`url(#${id}-b3)`} />
      </g>
    </svg>
  );
}
