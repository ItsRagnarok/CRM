import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, FileText, Receipt, Trash2 } from "lucide-react";
import { requireBackOfficeContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todayInOrgTimeZone } from "@/lib/date";
import { PAY_LABEL, PROVIDER_LABEL, capabilities, loadConnection, type PayMethod } from "@/lib/invoicing";
import { lei } from "@/lib/invoicing/calc";
import { deletePayment } from "../actions";
import { DangerActions, EinvoiceButton, EmailForm, PaymentForm } from "./doc-actions";
import { docStatus } from "../status";

const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ emis?: string }> }) {
  const { id } = await params;
  const { emis } = await searchParams;
  const ctx = await requireBackOfficeContext();
  if (!ctx) redirect("/dashboard");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: inv } = await supabase.from("invoices")
    .select("*, clients(id, name, email), jobs(id, display_number, title), invoice_lines(*), invoice_payments(id, amount, method, paid_on, document, source)")
    .eq("id", id).eq("organization_id", ctx.organization.id).maybeSingle();
  if (!inv) notFound();
  const [{ data: related }, connection] = await Promise.all([
    supabase.from("invoices").select("id, invoice_number, doc_type, status").or(`reference_invoice_id.eq.${inv.id}${inv.reference_invoice_id ? `,id.eq.${inv.reference_invoice_id}` : ""}`).eq("organization_id", ctx.organization.id),
    loadConnection(supabase, ctx.organization.id),
  ]);
  const sameProvider = !inv.provider || (connection && connection.provider === inv.provider);
  const caps = capabilities(inv.provider ? connection : null);
  const children = (related ?? []).filter((r) => r.id !== inv.reference_invoice_id);
  const parent = (related ?? []).find((r) => r.id === inv.reference_invoice_id) ?? null;
  const stornoOf = children.find((r) => r.doc_type === "storno") ?? null;
  const invoicedFrom = children.find((r) => r.doc_type === "factura" && r.status !== "cancelled") ?? null;
  const st = docStatus(inv, { reversed: Boolean(stornoOf), invoiced: Boolean(invoicedFrom) }, todayInOrgTimeZone());
  const gross = Number(inv.gross_amount);
  const paid = Number(inv.paid_amount);
  const rest = Math.round((gross - paid) * 100) / 100;
  const lines = [...(inv.invoice_lines ?? [])].sort((a, b) => a.position - b.position);
  const payments = [...(inv.invoice_payments ?? [])].sort((a, b) => a.paid_on.localeCompare(b.paid_on));
  const byRate = new Map<number, number>();
  for (const l of lines) byRate.set(Number(l.vat_percent), (byRate.get(Number(l.vat_percent)) ?? 0) + Number(l.line_vat));
  const client = (inv.client_snapshot ?? {}) as { name?: string; vatCode?: string | null; regCom?: string | null; address?: string | null; city?: string | null; county?: string | null; email?: string | null; phone?: string | null };
  const title = inv.doc_type === "proforma" ? "Proformă" : inv.doc_type === "storno" ? "Factură de stornare" : "Factură";
  const isInvoice = inv.doc_type === "factura";
  const open = inv.status !== "cancelled";
  const local = !inv.provider || inv.simulated;
  const today = todayInOrgTimeZone();

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5 p-5 md:p-7">
      <div className="flex flex-wrap items-start gap-4">
        <Link href="/facturare" aria-label="Înapoi la facturare" className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-border bg-white text-[#344054]"><ArrowLeft className="h-4 w-4" /></Link>
        <div className="ef-cal-tile flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"><FileText className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[24px] font-extrabold leading-tight tracking-tight">{title} {inv.invoice_number}</h1>
            <span className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${st.cls}`}>{st.label}</span>
          </div>
          <p className="mt-0.5 text-[13.5px] text-muted">
            Emisă {fmt(inv.issued_at)}{inv.due_date && isInvoice ? ` · scadentă ${fmt(inv.due_date)}` : ""}
            {inv.provider ? ` · ${PROVIDER_LABEL[inv.provider as "smartbill" | "oblio"]}${inv.simulated ? " (simulat)" : ""}` : " · evidență internă"}
            {inv.e_invoice_status ? ` · e-Factura: ${inv.e_invoice_status}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/facturi/${inv.id}/pdf`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-[10px] border border-border bg-white px-3.5 py-2 text-[13px] font-bold"><Download className="h-4 w-4" /> PDF</a>
          {inv.provider_url && !inv.simulated && <a href={inv.provider_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-[10px] border border-border bg-white px-3.5 py-2 text-[13px] font-bold"><ExternalLink className="h-4 w-4" /> Link pentru client</a>}
          {inv.doc_type === "proforma" && open && !invoicedFrom && <Link href={`/facturare/noua?from=${inv.id}`} className="rounded-[10px] bg-electric px-3.5 py-2 text-[13px] font-extrabold">Transformă în factură</Link>}
        </div>
      </div>

      {emis && <div role="status" className="rounded-[13px] bg-success-bg p-3.5 text-[13.5px] font-semibold text-success">{title} {inv.invoice_number} a fost {inv.provider && !inv.simulated ? `emisă în ${PROVIDER_LABEL[inv.provider as "smartbill" | "oblio"]}` : inv.simulated ? "emisă (simulat)" : "salvată"}.</div>}
      {!sameProvider && <div className="rounded-[13px] bg-warning-bg p-3.5 text-[13px] font-semibold text-warning">Documentul e emis în {PROVIDER_LABEL[inv.provider as "smartbill" | "oblio"]}, dar firma e conectată acum la alt furnizor. Gestionează-l din contul în care a fost emis.</div>}
      {local && !inv.simulated && <div className="rounded-[13px] bg-warning-bg p-3.5 text-[13px] font-semibold text-warning">Evidență internă: nu e factură fiscală și nu ajunge în e-Factura.</div>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="grid gap-4 rounded-[14px] border border-border bg-white p-5 sm:grid-cols-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Client</div>
              <div className="mt-1 text-[15px] font-extrabold">{client.name ?? inv.clients?.name}</div>
              <div className="mt-1 text-[12.5px] leading-relaxed text-muted">
                {client.vatCode && <>CUI {client.vatCode}{client.regCom ? ` · ${client.regCom}` : ""}<br /></>}
                {[client.address, client.city, client.county].filter(Boolean).join(", ")}
                {client.email && <><br />{client.email}</>}{client.phone && <> · {client.phone}</>}
              </div>
              {inv.clients && <Link href={`/clienti/${inv.clients.id}`} className="mt-1 inline-block text-[12px] font-bold text-electric">Fișa clientului →</Link>}
            </div>
            <div className="flex flex-col gap-1.5 text-[12.5px]">
              {inv.jobs && <div><span className="text-muted">Lucrare: </span><Link href={`/lucrari/${inv.jobs.id}`} className="font-bold text-electric">#{inv.jobs.display_number} {inv.jobs.title}</Link></div>}
              {parent && <div><span className="text-muted">{inv.doc_type === "storno" ? "Stornează: " : "Din proforma: "}</span><Link href={`/facturare/${parent.id}`} className="font-bold text-electric">{parent.invoice_number}</Link></div>}
              {stornoOf && <div><span className="text-muted">Stornată prin: </span><Link href={`/facturare/${stornoOf.id}`} className="font-bold text-electric">{stornoOf.invoice_number}</Link></div>}
              {invoicedFrom && <div><span className="text-muted">Facturată prin: </span><Link href={`/facturare/${invoicedFrom.id}`} className="font-bold text-electric">{invoicedFrom.invoice_number}</Link></div>}
              {inv.mentions && <div><span className="text-muted">Mențiuni: </span>{inv.mentions}</div>}
              {inv.emailed_at && <div className="text-muted">Trimisă pe e-mail: {new Date(inv.emailed_at).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>}
            </div>
          </section>

          <section className="overflow-hidden rounded-[14px] border border-border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-[13px]">
                <thead><tr className="bg-[#f9fafb] text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5">Denumire</th><th className="px-3 py-2.5">UM</th><th className="px-3 py-2.5 text-right">Cant.</th><th className="px-3 py-2.5 text-right">Preț</th><th className="px-3 py-2.5 text-right">TVA</th><th className="px-4 py-2.5 text-right">Valoare</th>
                </tr></thead>
                <tbody>
                  {lines.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-3 text-muted">Document din versiunea veche: {[["Manoperă", inv.labor_amount], ["Materiale", inv.materials_amount], ["Deplasare", inv.travel_amount], ["Altele", inv.other_amount]].filter(([, v]) => Number(v)).map(([k, v]) => `${k} ${lei(Number(v))}`).join(" · ")}</td></tr>
                  )}
                  {lines.map((l) => (
                    <tr key={l.id} className="border-t border-[#f2f4f7]">
                      <td className="px-4 py-2.5 font-semibold">{l.name}<span className="ml-1.5 text-[11px] font-normal text-muted">{l.is_service ? "serviciu" : "marfă"}</span></td>
                      <td className="px-3 py-2.5">{l.unit}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{Number(l.quantity).toLocaleString("ro-RO")}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{Number(l.unit_price).toLocaleString("ro-RO", { minimumFractionDigits: 2 })}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{Number(l.vat_percent)}%</td>
                      <td className="px-4 py-2.5 text-right font-bold tabular-nums">{Number(l.net_amount).toLocaleString("ro-RO", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="ml-auto flex w-full max-w-[320px] flex-col gap-1 border-t border-border px-4 py-3 text-[13px]">
              <div className="flex justify-between"><dt className="text-muted">Fără TVA</dt><dd className="tabular-nums">{lei(Number(inv.total_amount))}</dd></div>
              {[...byRate.entries()].sort((a, b) => b[0] - a[0]).map(([r, v]) => <div key={r} className="flex justify-between"><dt className="text-muted">TVA {r}%</dt><dd className="tabular-nums">{lei(v)}</dd></div>)}
              {lines.length === 0 && Number(inv.vat_amount) !== 0 && <div className="flex justify-between"><dt className="text-muted">TVA</dt><dd className="tabular-nums">{lei(Number(inv.vat_amount))}</dd></div>}
              <div className="mt-1 flex justify-between border-t border-border pt-1.5 text-[15px] font-extrabold"><dt>Total</dt><dd className="tabular-nums">{lei(gross)}</dd></div>
              {isInvoice && <div className="flex justify-between"><dt className="text-muted">Încasat</dt><dd className="tabular-nums text-success">{lei(paid)}</dd></div>}
              {isInvoice && open && rest > 0.009 && <div className="flex justify-between font-bold"><dt>Rest de plată</dt><dd className="tabular-nums text-danger">{lei(rest)}</dd></div>}
            </dl>
          </section>

          {isInvoice && (
            <section className="rounded-[14px] border border-border bg-white p-5">
              <h2 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold"><Receipt className="h-4 w-4" /> Încasări</h2>
              {payments.length === 0 ? <p className="text-[13px] text-muted">Nicio încasare încă.</p> : (
                <ul className="divide-y divide-[#f2f4f7]">
                  {payments.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 py-2 text-[13px]">
                      <span className="w-24 tabular-nums text-muted">{fmt(p.paid_on)}</span>
                      <span className="flex-1">{PAY_LABEL[p.method as PayMethod] ?? p.method}{p.document ? ` · ${p.document}` : ""}{p.source === "furnizor" ? " · sincronizat" : ""}</span>
                      <span className="font-bold tabular-nums">{lei(Number(p.amount))}</span>
                      {local && (
                        <form action={deletePayment}>
                          <input type="hidden" name="id" value={inv.id} /><input type="hidden" name="paymentId" value={p.id} />
                          <button type="submit" aria-label="Șterge încasarea" className="rounded-[8px] p-1 text-muted-2 hover:bg-danger-bg hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {!local && payments.length > 0 && <p className="mt-2 text-[11.5px] text-muted-2">O încasare greșită se șterge din contul {PROVIDER_LABEL[inv.provider as "smartbill" | "oblio"]}; apoi apasă „Sincronizează” în Facturare.</p>}
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          {isInvoice && open && rest > 0.009 && sameProvider && (
            <section className="rounded-[14px] border border-border bg-white p-5">
              <h2 className="mb-3 text-[15px] font-extrabold">Încasează</h2>
              <PaymentForm id={inv.id} rest={rest} today={today} hasReceiptSeries={Boolean(connection?.receiptSeries)} />
            </section>
          )}
          {open && sameProvider && caps.email && inv.provider && (
            <section className="rounded-[14px] border border-border bg-white p-5">
              <h2 className="mb-3 text-[15px] font-extrabold">Trimite clientului</h2>
              <EmailForm id={inv.id} email={client.email ?? inv.clients?.email ?? ""} />
            </section>
          )}
          {isInvoice && open && sameProvider && caps.einvoice && (
            <section className="rounded-[14px] border border-border bg-white p-5">
              <h2 className="mb-1 text-[15px] font-extrabold">e-Factura</h2>
              <p className="mb-3 text-[12px] text-muted">{inv.e_invoice_status ? `Stare: ${inv.e_invoice_status}.` : "Încă netrimisă din platformă."}</p>
              <EinvoiceButton id={inv.id} />
            </section>
          )}
          {sameProvider && (open || inv.status === "cancelled") && inv.doc_type !== "storno" && (
            <section className="rounded-[14px] border border-border bg-white p-5">
              <h2 className="mb-3 text-[15px] font-extrabold">Corectează</h2>
              <DangerActions
                id={inv.id}
                docLabel={`${title.toLowerCase()} ${inv.invoice_number}`}
                canCancel={open && paid < 0.01}
                canRestore={inv.status === "cancelled" && !stornoOf}
                canReverse={isInvoice && open}
              />
              <p className="mt-3 text-[11.5px] leading-relaxed text-muted-2">Anularea e pentru o greșeală prinsă repede, fără încasări. După ce s-a încasat sau a ajuns la client, se emite o stornare (aceleași rânduri în minus), apoi o factură corectă.</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
