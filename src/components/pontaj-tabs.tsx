import Link from "next/link";

// The mockup groups these four under "Pontaj, concedii, cheltuieli": same tab bar on each page.
const TABS = [
  { href: "/pontaj", label: "Pontaj" },
  { href: "/pontaj/concedii", label: "Concedii" },
  { href: "/cheltuieli", label: "Cheltuieli" },
] as const;

export function PontajTabs({ active }: { active: (typeof TABS)[number]["href"] }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Pontaj, concedii și cheltuieli">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} role="tab" aria-selected={t.href === active}
          className={`rounded-full border px-3.5 py-1.5 text-[13px] font-bold ${t.href === active ? "border-[#1f2024] bg-[#1f2024] text-white" : "border-border bg-white text-[#344054]"}`}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}
