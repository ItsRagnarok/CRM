import { randomUUID } from "node:crypto";
import Link from "next/link";
import { billingDb, workflow } from "@/lib/billing/store";
import { todayRo } from "@/lib/billing/money";
import type { InvoiceDetail } from "@/lib/billing/types";
import { InvoiceEditor } from "../editor";
import { card, primary } from "../../ui";
export default async function NewInvoice({
  searchParams,
}: {
  searchParams: Promise<{ tip?: string; client?: string; draft?: string }>;
}) {
  const p = await searchParams,
    db = await billingDb();
  const [company, clients, series, connection, draft] = await Promise.all([
    db.from("billing_company_settings").select("*").eq("id", 1).maybeSingle(),
    db
      .from("billing_clients")
      .select("id,name,cui")
      .eq("archived", false)
      .order("name")
      .limit(100),
    db
      .from("billing_series")
      .select("id,name,document_type")
      .eq("active", true)
      .order("name"),
    db
      .from("billing_oblio_connections")
      .select("enabled")
      .eq("company_id", 1)
      .maybeSingle(),
    p.draft
      ? workflow<InvoiceDetail | null>("detail", { id: p.draft })
      : Promise.resolve(null),
  ]);
  if (company.error || clients.error || series.error || connection.error)
    throw new Error("Datele nu au putut fi încărcate.");
  if (!company.data)
    return (
      <section className={card}>
        <h1 className="text-2xl font-bold">Datele firmei</h1>
        <p className="my-4 text-muted">
          Completează firma pentru care emiți facturi, apoi revino aici.
        </p>
        <Link className={primary} href="/admin/facturare/setari">
          Completează firma
        </Link>
      </section>
    );
  if (
    draft &&
    (draft.status !== "draft" || draft.document_type === "credit_note")
  )
    return (
      <Link href={`/admin/facturare/facturi/${draft.id}`}>
        Deschide documentul →
      </Link>
    );
  const kind =
    draft?.document_type ?? (p.tip === "proforma" ? "proforma" : "invoice");
  const date = draft?.issue_date ?? todayRo();
  const due =
    draft?.due_date ??
    new Date(
      new Date(date + "T12:00:00Z").getTime() +
        company.data.default_due_days * 86400000,
    )
      .toISOString()
      .slice(0, 10);
  const list = clients.data ?? [];
  const selected = draft?.client_id ?? p.client;
  if (selected && !list.some((c) => c.id === selected)) {
    const { data: c } = await db
      .from("billing_clients")
      .select("id,name,cui")
      .eq("id", selected)
      .maybeSingle();
    if (c) list.unshift(c);
  }
  return (
    <InvoiceEditor
      id={draft?.id ?? randomUUID()}
      clients={list}
      series={(series.data ?? []).filter((s) => s.document_type === kind)}
      defaultClient={selected}
      kind={kind}
      date={date}
      due={due}
      vat={String(company.data.vat_payer ? company.data.default_vat_rate : 0)}
      notes={draft?.notes ?? ""}
      connected={!!connection.data?.enabled}
      initialLines={draft?.lines.map((l) => ({
        name: l.name,
        unit: l.unit,
        service: l.is_service,
        quantity: l.quantity,
        price: l.unit_price,
        vat: l.vat_rate,
      }))}
    />
  );
}
