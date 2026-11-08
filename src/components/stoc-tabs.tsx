import Link from "next/link";

// Mockup "Stoc și mașini": stock and the purchase requests coming from the field.
const TABS = [
  { href: "/materiale", label: "Stoc și scule" },
  { href: "/aprobari", label: "Cereri de materiale" },
] as const;

export function StocTabs({ active }: { active: (typeof TABS)[number]["href"] }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Stoc și cereri de materiale">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} role="tab" aria-selected={t.href === active}
          className={`rounded-full border px-3.5 py-1.5 text-[13px] font-bold ${t.href === active ? "border-[#1f2024] bg-[#1f2024] text-white" : "border-border bg-white text-[#344054]"}`}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}
