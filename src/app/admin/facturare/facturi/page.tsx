import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { workflow } from "@/lib/billing/store";
import type { InvoiceRow } from "@/lib/billing/types";
import { InvoiceList, primary } from "../ui";
export default async function Invoices({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; page?: string }>;
}) {
  const p = await searchParams;
  const q = (p.q ?? "").slice(0, 100),
    filter = p.filter ?? "all",
    page = Math.max(1, Math.min(4000, parseInt(p.page ?? "1") || 1));
  const rows = await workflow<InvoiceRow[]>("list", {
    q,
    filter,
    offset: (page - 1) * 25,
  });
  const href = (f: string, n = 1) =>
    `/admin/facturare/facturi?q=${encodeURIComponent(q)}&filter=${f}&page=${n}`;
  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold">Facturi</h1>
        <Link href="/admin/facturare/facturi/noua" className={primary}>
          <Plus size={18} />
          Factură nouă
        </Link>
      </header>
      <form className="flex items-center gap-3 rounded-2xl border border-border bg-white px-5 py-3">
        <Search className="text-muted" size={20} />
        <input
          aria-label="Caută client sau număr"
          name="q"
          defaultValue={q}
          placeholder="Caută client sau număr"
          className="min-w-0 flex-1 bg-transparent py-1 outline-none"
        />
        <input type="hidden" name="filter" value={filter} />
        <button className="font-semibold text-purple">Caută</button>
      </form>
      <div className="flex flex-wrap gap-2">
        {[
          ["all", "Toate"],
          ["outstanding", "De încasat"],
          ["overdue", "Restante"],
          ["paid", "Plătite"],
          ["draft", "Ciorne"],
          ["proforma", "Proforme"],
        ].map(([key, label]) => (
          <Link
            key={key}
            href={href(key)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${filter === key ? "border-purple bg-purple text-white" : "border-border bg-white"}`}
          >
            {label}
          </Link>
        ))}
      </div>
      <InvoiceList
        rows={rows.slice(0, 25)}
        empty="Nu există facturi pentru filtrele alese."
      />
      <div className="flex justify-between text-sm font-semibold text-purple">
        {page > 1 ? (
          <Link href={href(filter, page - 1)}>← Înapoi</Link>
        ) : (
          <span />
        )}
        {rows.length > 25 && (
          <Link href={href(filter, page + 1)}>Mai multe →</Link>
        )}
      </div>
    </div>
  );
}
