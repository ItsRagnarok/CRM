import Link from "next/link";
import { Lock } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { demoLocked } from "@/lib/demo";

// Mockup "Stoc și mașini": stock and the purchase requests coming from the field.
const TABS = [
  { href: "/materiale", label: "Stoc și scule", feature: "stoc" },
  { href: "/materiale/masini", label: "Stoc pe mașini", feature: "stoc.masini" },
  { href: "/materiale/scule", label: "Registru scule", feature: "stoc.scule" },
  { href: "/aprobari", label: "Cereri de materiale", feature: "stoc.cereri" },
  { href: "/foaie-parcurs", label: "Foaie de parcurs", feature: "stoc.foaie" },
] as const;

export async function StocTabs({ active }: { active: (typeof TABS)[number]["href"] }) {
  // Cont demo: subfuncțiile blocate de Super Admin au lacăt (deschise, arată „se configurează pe firma ta”).
  const { organization } = await requireSessionContext();
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Stoc și cereri de materiale">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} role="tab" aria-selected={t.href === active}
          className={`rounded-full border px-3.5 py-1.5 text-[13px] font-bold ${t.href === active ? "border-[#1f2024] bg-[#1f2024] text-white" : "border-border bg-white text-[#344054]"}`}>
          {demoLocked(organization, t.feature) && <Lock className="mr-1 inline h-3.5 w-3.5 align-[-2px] opacity-70" aria-label="Blocat în demo" />}
          {t.label}
        </Link>
      ))}
    </div>
  );
}
