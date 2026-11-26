import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Banknote, ClipboardList, FilePlus2, FileText, Receipt, Search, Wallet } from "lucide-react";
import { requireBackOfficeContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todayInOrgTimeZone } from "@/lib/date";
import { PROVIDER_LABEL, capabilities, loadConnection } from "@/lib/invoicing";
import { lei } from "@/lib/invoicing/calc";
import { resolveBillingRequest } from "./actions";
import { SyncButton } from "./sync-button";
import { DisconnectInvoicingButton } from "../setari/disconnect-invoicing-button";
import { docStatus } from "./status";

const FILTERS = [
  { id: "", label: "Toate" },
  { id: "deincasat", label: "De încasat" },
  { id: "restante", label: "Restante" },
  { id: "incasate", label: "Încasate" },
  { id: "proforme", label: "Proforme" },
  { id: "anulate", label: "Anulate și stornări" },
] as const;

const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default async function FacturarePage({ searchParams }: { searchParams: Promise<{ f?: string; q?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireBackOfficeContext();
  if (!ctx) redirect("/dashboard");
  const { organization } = ctx;
  const supabase = await createClient();
  const today = todayInOrgTimeZone();
  const monthStart = `${today.slice(0, 7)}-01`;
  const filter = FILTERS.some((f) => f.id === sp.f) ? (sp.f as string) : "";
  const q = (sp.q ?? "").trim().slice(0, 60);

  const connection = await loadConnection(supabase, organization.id);
  const caps = capabilities(connection);
  const [{ data: docs }, { data: finished }, { data: requests }, { data: monthPayments }] = await Promise.all([
    supabase.from("invoices")
      .select("id, invoice_number, doc_type, status, issued_at, due_date, gross_amount, paid_amount, provider, simulated, e_invoice_status, reference_invoice_id, client_snapshot, clients(name), jobs(display_number)")
      .eq("organization_id", organization.id).order("issued_at", { ascending: false }).order("created_at", { ascending: false }).limit(1000),
    supabase.from("jobs").select("id, display_number, title, work_ended_at, scheduled_date, clients(name), invoices(doc_type, status)")
      .eq("organization_id", organization.id).eq("status", "finalizata").order("scheduled_date", { ascending: false }).limit(300),
    supabase.from("billing_requests").select("id, job_id, collected_method, collected_amount, note, profiles!billing_requests_requested_by_fkey(full_name)")
      .eq("organization_id", organization.id).eq("status", "new"),
    supabase.from("invoice_payments").select("amount").eq("organization_id", organization.id).gte("paid_on", monthStart),
  ]);

  const all = docs ?? [];
  const reversed = new Set(all.filter((d) => d.doc_type === "storno" && d.reference_invoice_id).map((d) => d.reference_invoice_id));
  const invoiced = new Set(all.filter((d) => d.doc_type === "factura" && d.status !== "cancelled" && d.reference_invoice_id).map((d) => d.reference_invoice_id));
  const rows = all.map((d) => ({ ...d, st: docStatus(d, { reversed: reversed.has(d.id), invoiced: invoiced.has(d.id) }, today) }));
  const openInvoices = rows.filter((d) => d.doc_type === "factura" && d.status !== "cancelled" && !["incasata"].includes(d.st.key));
  const rest = (d: (typeof rows)[number]) => Number(d.gross_amount) - Number(d.paid_amount);
  const toCollect = openInvoices.reduce((a, d) => a + rest(d), 0);
  const late = openInvoices.filter((d) => d.st.key === "restanta");
  const lateSum = late.reduce((a, d) => a + rest(d), 0);
  const collectedMonth = (monthPayments ?? []).reduce((a, p) => a + Number(p.amount), 0);
  const issuedMonth = rows.filter((d) => d.doc_type !== "proforma" && d.status !== "cancelled" && d.issued_at >= monthStart).reduce((a, d) => a + Number(d.gross_amount), 0);

  const reqByJob = new Map((requests ?? []).map((r) => [r.job_id, r]));
  const toBill = (finished ?? []).filter((j) => !(j.invoices ?? []).some((i) => i.doc_type === "factura" && i.status !== "cancelled"));

  const shown = rows.filter((d) => {
    if (filter === "deincasat" && !(d.doc_type === "factura" && ["neincasata", "partial", "restanta"].includes(d.st.key))) return false;
    if (filter === "restante" && d.st.key !== "restanta") return false;
    if (filter === "incasate" && d.st.key !== "incasata") return false;
    if (filter === "proforme" && d.doc_type !== "proforma") return false;
    if (filter === "anulate" && !(d.status === "cancelled" || d.doc_type === "storno")) return false;
    if (q) {
      const name = ((d.client_snapshot as { name?: string } | null)?.name ?? d.clients?.name ?? "").toLowerCase();
      if (!`${name} ${d.invoice_number.toLowerCase()} ${d.jobs?.display_number ?? ""}`.includes(q.toLowerCase())) return false;
    }
    return true;
  });
  const href = (over: { f?: string; q?: string }) => {
    const p = new URLSearchParams();
    const f = over.f ?? filter; const qq = over.q ?? q;
    if (f) p.set("f", f); if (qq) p.set("q", qq);
    const s = p.toString();
    return `/facturare${s ? `?${s}` : ""}`;
  };
  const providerLabel = connection ? PROVIDER_LABEL[connection.provider] : null;
  const canProforma = caps.mode === "intern" || Boolean(connection?.proformaSeries) || caps.mode === "demo";

  return (
    <div className="flex flex-col gap-5 p-5 md:p-7">
      <div className="flex flex-wrap items-start gap-4">
        <div className="ef-cal-tile flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"><Receipt className="h-6 w-6" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[26px] font-extrabold leading-tight tracking-tight">Facturare și încasări</h1>
            <span className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${caps.mode === "real" ? "bg-success-bg text-success" : caps.mode === "demo" ? "bg-warning-bg text-warning" : "bg-neutral-bg text-neutral"}`}>
              {caps.mode === "real" ? `Conectat la ${providerLabel}` : caps.mode === "demo" ? `${providerLabel} · demo simulat` : "Fără furnizor conectat"}
            </span>
          </div>
          <p className="mt-0.5 text-[14px] text-muted">Emiți facturi și proforme, urmărești ce e de încasat și înregistrezi plățile. {caps.mode === "intern" && <Link href="/setari?tab=integrari" className="font-bold text-electric">Conectează SmartBill sau Oblio →</Link>}</p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          {caps.mode === "real" && providerLabel && <SyncButton label={providerLabel} />}
          {caps.mode !== "intern" && providerLabel && ctx.profile.role === "admin" && <DisconnectInvoicingButton label={providerLabel} variant="button" />}
          {canProforma && <Link href="/facturare/noua?tip=proforma" className="flex h-10 items-center gap-2 rounded-[11px] border border-border bg-white px-3.5 text-[13px] font-bold"><FileText className="h-4 w-4" /> Proformă nouă</Link>}
          <Link href="/facturare/noua" className="flex h-10 items-center gap-2 rounded-[11px] bg-electric px-4 text-[13.5px] font-extrabold shadow-[0_6px_16px_rgba(132,204,22,.28)]"><FilePlus2 className="h-4 w-4" /> Factură nouă</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={ClipboardList} label="De facturat" value={String(toBill.length)} sub={toBill.length ? "lucrări terminate, fără factură" : "toate lucrările sunt facturate"} href="#de-facturat" />
        <Kpi icon={Wallet} label="De încasat" value={lei(toCollect)} sub={`${openInvoices.length} ${openInvoices.length === 1 ? "factură deschisă" : "facturi deschise"}`} href={href({ f: "deincasat" })} />
        <Kpi icon={AlertTriangle} label="Restante" value={lei(lateSum)} sub={late.length ? `${late.length} trecute de scadență` : "nimic peste termen"} href={href({ f: "restante" })} alert={late.length > 0} />
        <Kpi icon={Banknote} label="Încasat luna aceasta" value={lei(collectedMonth)} sub={`facturat: ${lei(issuedMonth)}`} href={href({ f: "incasate" })} />
      </div>

      {toBill.length > 0 && (
        <section id="de-facturat" className="overflow-hidden rounded-2xl border border-[#fec84b] bg-[#fffaeb]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#fedf89] px-5 py-3">
            <h2 className="text-[14.5px] font-extrabold text-[#93370d]">De facturat · {toBill.length}</h2>
            <span className="text-[12px] text-[#93370d]">Rândurile se completează singure din ore și materiale.</span>
          </div>
          <ul className="divide-y divide-[#fedf89]">
            {toBill.slice(0, 8).map((j) => {
              const r = reqByJob.get(j.id);
              return (
                <li key={j.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-bold">#{j.display_number} · {j.title} · {j.clients?.name ?? "Client"}</div>
                    <div className="text-[12px] text-[#7a2e0e]">
                      Terminată {fmt((j.work_ended_at ?? j.scheduled_date).slice(0, 10))}
                      {r ? ` · ${r.profiles?.full_name ?? "Tehnicianul"} a cerut factura${r.collected_amount ? ` · a încasat ${Number(r.collected_amount).toFixed(2)} lei (${r.collected_method})` : ""}${r.note ? ` · „${r.note}”` : ""}` : ""}
                    </div>
                  </div>
                  <Link href={`/facturare/noua?job=${j.id}`} className="rounded-[10px] bg-electric px-3.5 py-2 text-[12.5px] font-extrabold">Facturează</Link>
                  {r && (
                    <form action={resolveBillingRequest}>
                      <input type="hidden" name="requestId" value={r.id} />
                      <button type="submit" className="px-2 py-2 text-[12px] font-semibold text-[#93370d]">Ignoră cererea</button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
          {toBill.length > 8 && <div className="border-t border-[#fedf89] px-5 py-2.5 text-[12.5px] text-[#93370d]">Încă {toBill.length - 8}: le găsești și la „Factură nouă” → „Completează dintr-o lucrare terminată”.</div>}
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#f2f4f7] px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <Link key={f.id} href={href({ f: f.id })} className={`rounded-full px-3 py-1.5 text-[12.5px] font-bold ${filter === f.id ? "bg-[#101828] text-white" : "text-[#344054] hover:bg-[#f2f4f7]"}`}>{f.label}</Link>
            ))}
          </div>
          <form action="/facturare" className="ml-auto flex items-center gap-2">
            {filter && <input type="hidden" name="f" value={filter} />}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />
              <input name="q" defaultValue={q} placeholder="Client, număr, lucrare…" className="h-9 w-[220px] rounded-[10px] border border-[#d0d5dd] pl-8 pr-3 text-[13px] outline-none focus:border-electric" />
            </div>
          </form>
        </div>
        {shown.length === 0 ? (
          <div className="px-5 py-12 text-center text-[13.5px] text-muted">{all.length ? "Niciun document pentru filtrul ales." : "Niciun document încă. Emite prima factură din „Factură nouă” sau din „De facturat”."}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="bg-[#f9fafb] text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                  <th className="px-5 py-2.5">Document</th><th className="px-3 py-2.5">Client</th><th className="px-3 py-2.5">Emisă</th><th className="px-3 py-2.5">Scadența</th><th className="px-3 py-2.5 text-right">Total</th><th className="px-3 py-2.5 text-right">Încasat</th><th className="px-5 py-2.5">Stare</th>
                </tr>
              </thead>
              <tbody>
                {shown.slice(0, 300).map((d) => {
                  const name = (d.client_snapshot as { name?: string } | null)?.name ?? d.clients?.name ?? "—";
                  const kind = d.doc_type === "proforma" ? "Proformă" : d.doc_type === "storno" ? "Stornare" : "Factură";
                  return (
                    <tr key={d.id} className="border-t border-[#f2f4f7] hover:bg-[#f9fafb]">
                      <td className="px-5 py-3">
                        <Link href={`/facturare/${d.id}`} className="text-[13.5px] font-extrabold text-foreground hover:underline">{d.invoice_number}</Link>
                        <div className="text-[11.5px] text-muted">{kind}{d.jobs ? ` · lucrarea #${d.jobs.display_number}` : ""}{d.simulated ? " · simulat" : !d.provider ? " · internă" : ""}</div>
                      </td>
                      <td className="max-w-[260px] truncate px-3 py-3 text-[13px] text-[#344054]">{name}</td>
                      <td className="px-3 py-3 text-[12.5px] text-muted">{fmt(d.issued_at)}</td>
                      <td className={`px-3 py-3 text-[12.5px] ${d.st.key === "restanta" ? "font-bold text-danger" : "text-muted"}`}>{d.doc_type === "factura" && d.due_date ? fmt(d.due_date) : "—"}</td>
                      <td className="px-3 py-3 text-right text-[13.5px] font-bold tabular-nums">{lei(Number(d.gross_amount))}</td>
                      <td className="px-3 py-3 text-right text-[12.5px] tabular-nums text-muted">{d.doc_type === "factura" ? lei(Number(d.paid_amount)) : "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${d.st.cls}`}>{d.st.label}</span>
                        {d.e_invoice_status && <div className="mt-1 text-[11px] text-muted">e-Factura: {d.e_invoice_status}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, href, alert = false }: { icon: typeof Wallet; label: string; value: string; sub: string; href: string; alert?: boolean }) {
  return (
    <Link href={href} className="relative overflow-hidden rounded-2xl border border-border bg-white px-5 py-4 shadow-[0_1px_3px_rgba(16,24,40,.04)] hover:border-[#c8d0dc]">
      <div className="flex items-start gap-3.5">
        <div className={`${alert ? "ef-cal-tile-red" : "ef-cal-tile"} flex h-10 w-10 shrink-0 items-center justify-center rounded-xl`}><Icon className="h-[18px] w-[18px]" /></div>
        <div className="relative z-10 min-w-0">
          <div className="text-[13.5px] font-semibold">{label}</div>
          <div className="mt-1 truncate text-[24px] font-extrabold leading-tight tabular-nums">{value}</div>
          <div className="mt-1 truncate text-[12.5px] text-muted">{sub}</div>
        </div>
      </div>
      <svg aria-hidden="true" className="pointer-events-none absolute -bottom-1 right-0 h-14 w-36" viewBox="0 0 160 64" preserveAspectRatio="none">
        <path d="M0 64 C 50 60, 100 40, 160 8 L 160 64 Z" fill={alert ? "#ef4444" : "#a3e635"} fillOpacity={alert ? 0.1 : 0.16} />
      </svg>
    </Link>
  );
}
