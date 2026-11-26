// Starea unui document, pe înțelesul biroului: ce mai e de făcut cu el.
type Doc = { doc_type: string; status: string; due_date: string | null; issued_at: string; gross_amount: number | string | null; paid_amount: number | string | null };

export function docStatus(d: Doc, rel: { reversed?: boolean; invoiced?: boolean }, today: string) {
  const gross = Number(d.gross_amount ?? 0), paid = Number(d.paid_amount ?? 0);
  if (d.doc_type === "storno") return { key: "storno", label: "Stornare", cls: "bg-neutral-bg text-neutral" };
  if (d.status === "cancelled") return rel.reversed ? { key: "stornata", label: "Stornată", cls: "bg-neutral-bg text-neutral" } : { key: "anulata", label: "Anulată", cls: "bg-neutral-bg text-neutral" };
  if (d.doc_type === "proforma") return rel.invoiced ? { key: "facturata", label: "Facturată", cls: "bg-success-bg text-success" } : { key: "proforma", label: "Proformă", cls: "bg-info-bg text-info" };
  if (d.status === "paid" || (gross > 0 && paid >= gross - 0.01)) return { key: "incasata", label: "Încasată", cls: "bg-success-bg text-success" };
  const late = (d.due_date ?? d.issued_at) < today;
  if (paid > 0.009) return late ? { key: "restanta", label: "Parțial · restantă", cls: "bg-danger-bg text-danger" } : { key: "partial", label: "Încasată parțial", cls: "bg-warning-bg text-warning" };
  return late ? { key: "restanta", label: "Restantă", cls: "bg-danger-bg text-danger" } : { key: "neincasata", label: "De încasat", cls: "bg-warning-bg text-warning" };
}
