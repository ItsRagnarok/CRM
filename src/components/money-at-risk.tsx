import Link from "next/link";
import type { Database } from "@/lib/supabase/database.types";

export type MoneyAtRiskRow = Database["public"]["Functions"]["money_at_risk"]["Returns"][number];

const lei = (n: number) => `${Math.round(n).toLocaleString("ro-RO")} lei`;
const plural = (n: number, one: string, many: string) => `${n.toLocaleString("ro-RO")} ${n === 1 ? one : many}`;

// "Bani de recuperat": what the company risks losing right now, in lei. Overdue invoices are exact;
// the unbilled figure is an estimate (hours x hourly rates + materials), and is labeled as such.
export function MoneyAtRisk({ row: r }: { row: MoneyAtRiskRow | undefined }) {
  if (!r) return null;
  const overdue = Number(r.overdue_amount ?? 0);
  const unbilled = Number(r.unbilled_estimate ?? 0);
  const cash = Number(r.cash_open_amount ?? 0);
  const expenses = Number(r.pending_expenses_amount ?? 0);
  const total = overdue + unbilled;

  const rows: { key: string; label: string; value: string; sub: string; href: string; hint?: string }[] = [];
  if (r.overdue_count > 0) rows.push({ key: "overdue", label: "Facturi trecute de scadență", value: lei(overdue), sub: `${plural(Number(r.overdue_count), "factură", "facturi")} · cea mai veche, ${plural(Number(r.overdue_oldest_days), "zi", "zile")} peste termen`, href: "/facturare" });
  if (r.unbilled_jobs > 0) rows.push({ key: "unbilled", label: "Lucrări terminate, nefacturate", value: `~${lei(unbilled)}`, sub: `${plural(Number(r.unbilled_jobs), "lucrare", "lucrări")} · estimare din ore și materiale`, href: "/facturare", hint: "estimare" });
  if (r.cash_open_count > 0) rows.push({ key: "cash", label: "Bani încasați de tehnicieni, nefacturați", value: lei(cash), sub: `${plural(Number(r.cash_open_count), "încasare", "încasări")} de regularizat`, href: "/facturare" });
  if (r.pending_expenses_count > 0) rows.push({ key: "exp", label: "Cheltuieli neaprobate", value: lei(expenses), sub: `${plural(Number(r.pending_expenses_count), "cheltuială", "cheltuieli")} așteaptă decizie`, href: "/aprobari" });

  return (
    <div className="rounded-2xl border border-border bg-white p-5" aria-label="Bani de recuperat">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-bold text-foreground">Bani de recuperat</h2>
        {total > 0 && (
          <div className="text-right">
            <span className="text-[26px] font-extrabold tabular-nums tracking-tight text-foreground">{unbilled > 0 ? "~" : ""}{lei(total)}</span>
            <span className="block text-[11.5px] text-muted">facturi restante + lucrări nefacturate (estimare)</span>
          </div>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="py-3 text-[13.5px] text-muted">Totul e facturat și încasat la termen. Nu ai bani blocați acum.</p>
      ) : (
        <ul className="mt-2 divide-y divide-[#eef0f4]">
          {rows.map((x) => (
            <li key={x.key} className="flex items-center gap-3 py-3 text-[13.5px]">
              <span className="min-w-0 flex-1"><b className="block font-bold">{x.label}</b><span className="block truncate text-[12px] text-muted">{x.sub}</span></span>
              <span className="shrink-0 text-[15px] font-extrabold tabular-nums">{x.value}</span>
              <Link href={x.href} className="shrink-0 rounded-[10px] bg-electric px-3.5 py-2 text-[12.5px] font-extrabold">Rezolvă</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
