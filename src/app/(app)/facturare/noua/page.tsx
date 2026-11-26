import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FilePlus2 } from "lucide-react";
import { requireBackOfficeContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todayInOrgTimeZone } from "@/lib/date";
import { PROVIDER_LABEL, capabilities, loadCatalog, loadConnection } from "@/lib/invoicing";
import { InvoiceEditor, type ClientForm, type EditorClient, type EditorLine } from "./invoice-editor";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const METHOD: Record<string, "numerar" | "card" | "ordin_plata" | "alta"> = { cash: "numerar", numerar: "numerar", card: "card", transfer: "ordin_plata", op: "ordin_plata" };
const r2 = (n: number) => Math.round(n * 100) / 100;

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ job?: string; client?: string; from?: string; tip?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireBackOfficeContext();
  if (!ctx) redirect("/dashboard");
  const { organization } = ctx;
  const supabase = await createClient();
  const connection = await loadConnection(supabase, organization.id);
  const caps = capabilities(connection);
  const vatDefault = connection?.taxPercent ?? 21;
  const jobId = sp.job && UUID.test(sp.job) ? sp.job : null;
  const fromId = sp.from && UUID.test(sp.from) ? sp.from : null;

  const [catalog, { data: clientRows }, { data: jobRows }] = await Promise.all([
    loadCatalog(supabase, connection),
    supabase.from("clients").select("id, name, company_name, client_type, cui, address, email, phone").eq("organization_id", organization.id).order("name").limit(1000),
    supabase.from("jobs").select("id, display_number, title, clients(name), invoices(doc_type, status)").eq("organization_id", organization.id).eq("status", "finalizata").order("scheduled_date", { ascending: false }).limit(200),
  ]);
  const clients: EditorClient[] = (clientRows ?? []).map((c) => ({ id: c.id, name: c.company_name || c.name, type: c.client_type === "company" ? "company" : "individual", cui: c.cui, address: c.address, email: c.email, phone: c.phone }));
  const unbilled = (jobRows ?? []).filter((j) => !(j.invoices ?? []).some((i) => i.doc_type === "factura" && i.status !== "cancelled"));

  let lines: EditorLine[] = [];
  let clientId = sp.client && UUID.test(sp.client) ? sp.client : "";
  let jobLabel: string | null = null;
  let proformaLabel: string | null = null;
  let mentions = "";
  let collect: { method: "numerar" | "card" | "ordin_plata" | "alta"; amount: number } | null = null;
  let docType: "factura" | "proforma" = sp.tip === "proforma" ? "proforma" : "factura";
  let clientOverride: ClientForm | null = null;

  if (fromId) {
    // Factură din proformă: aceleași rânduri și același client.
    const { data: pf } = await supabase.from("invoices").select("id, invoice_number, client_id, job_id, mentions, client_snapshot, invoice_lines(name, unit, quantity, unit_price, vat_percent, is_service, code, position)")
      .eq("id", fromId).eq("organization_id", organization.id).eq("doc_type", "proforma").maybeSingle();
    if (pf) {
      docType = "factura";
      clientId = pf.client_id;
      proformaLabel = pf.invoice_number;
      const s = (pf.client_snapshot ?? null) as { name?: string; vatCode?: string | null; isTaxPayer?: boolean; regCom?: string | null; address?: string | null; city?: string | null; county?: string | null; email?: string | null; phone?: string | null } | null;
      if (s?.name) clientOverride = { name: s.name, type: s.vatCode ? "firma" : "persoana", cui: s.vatCode ?? "", regCom: s.regCom ?? "", address: s.address ?? "", city: s.city ?? "", county: s.county ?? "", email: s.email ?? "", phone: s.phone ?? "", vatPayer: Boolean(s.isTaxPayer) };
      mentions = pf.mentions ?? "";
      lines = (pf.invoice_lines ?? []).sort((a, b) => a.position - b.position).map((l) => ({ name: l.name, unit: l.unit, quantity: Number(l.quantity), price: Number(l.unit_price), vatPercent: Number(l.vat_percent), isService: l.is_service, code: l.code }));
    }
  } else if (jobId) {
    // Factură din lucrare: ore lucrate × tarif, materialele consumate cu adaos, ce a încasat tehnicianul.
    const [{ data: job }, { data: usage }, { data: request }] = await Promise.all([
      supabase.from("jobs").select("id, display_number, title, client_id, work_started_at, work_ended_at, job_assignments(profile_id)").eq("id", jobId).eq("organization_id", organization.id).maybeSingle(),
      supabase.from("material_usage").select("quantity, materials(name, unit, unit_cost)").eq("job_id", jobId).eq("organization_id", organization.id),
      supabase.from("billing_requests").select("collected_amount, collected_method").eq("job_id", jobId).eq("organization_id", organization.id).eq("status", "new").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (job) {
      clientId = job.client_id;
      jobLabel = `#${job.display_number}`;
      mentions = `Lucrarea #${job.display_number}: ${job.title}`;
      const people = Math.max(1, job.job_assignments?.length ?? 1);
      const hours = job.work_started_at && job.work_ended_at ? Math.max(0, (Date.parse(job.work_ended_at) - Date.parse(job.work_started_at)) / 3_600_000) : 0;
      const manHours = hours > 0 ? Math.max(0.5, Math.round(hours * people * 2) / 2) : 1;
      const rate = organization.invoice_labor_rate != null ? Number(organization.invoice_labor_rate) : 0;
      lines.push({
        name: `Manoperă: ${job.title}`, unit: "ore", quantity: manHours, price: rate, vatPercent: vatDefault, isService: true, code: null,
        hint: rate ? (hours > 0 ? `${people} ${people === 1 ? "om" : "oameni"} × ${hours.toFixed(1).replace(".", ",")} h` : "fără ore pontate: verifică") : "Completează tariful (sau setează-l în Setări → Integrări)",
      });
      const markup = Number(organization.invoice_material_markup ?? 0);
      const grouped = new Map<string, EditorLine>();
      for (const u of usage ?? []) {
        const m = u.materials;
        if (!m || !(Number(u.quantity) > 0)) continue;
        const key = m.name;
        const prev = grouped.get(key);
        if (prev) prev.quantity = r2(prev.quantity + Number(u.quantity));
        else grouped.set(key, { name: m.name, unit: m.unit || "buc", quantity: Number(u.quantity), price: r2(Number(m.unit_cost ?? 0) * (1 + markup / 100)), vatPercent: vatDefault, isService: false, code: null, hint: m.unit_cost ? undefined : "fără preț de achiziție: completează" });
      }
      lines.push(...grouped.values());
      if (request && Number(request.collected_amount) > 0) collect = { method: METHOD[String(request.collected_method ?? "").toLowerCase()] ?? "numerar", amount: Number(request.collected_amount) };
    }
  }

  const providerLabel = connection ? PROVIDER_LABEL[connection.provider] : null;
  return (
    <div className="flex flex-col gap-5 p-5 md:p-7">
      <div className="flex items-start gap-4">
        <Link href="/facturare" aria-label="Înapoi la facturare" className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-border bg-white text-[#344054]"><ArrowLeft className="h-4 w-4" /></Link>
        <div className="ef-cal-tile flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"><FilePlus2 className="h-5 w-5" /></div>
        <div className="min-w-0">
          <h1 className="text-[24px] font-extrabold leading-tight tracking-tight">{docType === "proforma" ? "Proformă nouă" : "Factură nouă"}</h1>
          <p className="mt-0.5 text-[13.5px] text-muted">
            {caps.mode === "real" ? `Se emite direct în ${providerLabel}; seriile și cotele TVA vin din contul tău.` : caps.mode === "demo" ? "Cont demonstrativ: totul e simulat." : "Fără furnizor conectat: evidență internă."}
          </p>
        </div>
      </div>
      <InvoiceEditor
        mode={caps.mode}
        providerLabel={providerLabel}
        clients={clients}
        initial={{ docType, clientId, jobId: fromId ? null : jobId, fromProformaId: proformaLabel ? fromId : null, lines, mentions, collect }}
        catalog={{ invoiceSeries: catalog.invoiceSeries, proformaSeries: catalog.proformaSeries, vatRates: catalog.vatRates, hasReceiptSeries: Boolean(connection?.receiptSeries) }}
        defaults={{ vat: vatDefault, dueDays: connection?.dueDays ?? 15, sendEmail: Boolean(connection?.sendEmail), today: todayInOrgTimeZone(), series: connection?.series ?? "FACT", proformaSeries: connection?.proformaSeries ?? (connection ? null : "PF") }}
        jobs={unbilled.map((j) => ({ id: j.id, label: `#${j.display_number} · ${j.clients?.name ?? "client"} · ${j.title}` }))}
        jobLabel={jobLabel}
        proformaLabel={proformaLabel}
        catalogError={catalog.error}
        clientOverride={clientOverride}
      />
    </div>
  );
}
