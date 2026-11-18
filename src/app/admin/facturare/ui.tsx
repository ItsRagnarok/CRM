import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import { money, displayDate } from "@/lib/billing/money";
import type { InvoiceRow } from "@/lib/billing/types";
export const card = "rounded-[20px] border border-border bg-white p-5 sm:p-6";
export const primary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-purple px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50";
export const secondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold hover:border-purple disabled:opacity-50";
export const statusLabels: Record<string, string> = {
  draft: "Ciornă",
  pending: "De verificat",
  paid: "Plătită",
  overdue: "Restantă",
  outstanding: "De încasat",
  proforma: "Proformă",
  credit_note: "Stornare",
};
export function Badge({ status }: { status: string }) {
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${status === "paid" ? "bg-success-bg text-success" : status === "overdue" ? "bg-amber-soft text-danger" : status === "draft" ? "bg-neutral-bg text-muted" : "bg-purple-soft text-purple"}`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}
export function InvoiceList({
  rows,
  empty = "Nu ai încă facturi. Prima factură începe cu un client și un serviciu.",
}: {
  rows: InvoiceRow[];
  empty?: string;
}) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-border bg-white">
      {rows.length ? (
        rows.map((r) => (
          <Link
            key={r.id}
            href={`/admin/facturare/facturi/${r.id}`}
            className="flex items-center justify-between gap-4 border-b border-border p-5 last:border-0 hover:bg-purple-soft"
          >
            <div className="min-w-0">
              <p className="truncate font-bold">{r.client_name}</p>
              <p className="mt-1 text-sm text-muted">
                {r.provider_number
                  ? `${r.provider_series} ${r.provider_number}`
                  : r.status === "pending"
                    ? "În curs de emitere"
                    : "Fără număr · ciornă"}{" "}
                · {displayDate(r.issue_date)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="mb-1.5 font-bold">{money(r.total)}</p>
              <Badge status={r.payment_status} />
            </div>
          </Link>
        ))
      ) : (
        <div className="p-8 text-center">
          <FileText className="mx-auto mb-3 text-muted" />
          <p className="text-sm text-muted">{empty}</p>
        </div>
      )}
    </div>
  );
}
export function SectionTitle({
  children,
  href,
}: {
  children: React.ReactNode;
  href?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold">{children}</h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-semibold text-purple"
        >
          Vezi toate <ArrowUpRight size={16} />
        </Link>
      )}
    </div>
  );
}
