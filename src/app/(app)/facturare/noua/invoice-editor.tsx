"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Plus, Search, Trash2, User } from "lucide-react";
import { findProducts, issueAction, lookupCompany, type ActionState } from "../actions";
import { addDays, lei, totals } from "@/lib/invoicing/calc";
import type { Product } from "@/lib/invoicing/types";

export type EditorClient = { id: string; name: string; type: "company" | "individual"; cui: string | null; address: string | null; email: string | null; phone: string | null };
export type EditorLine = { name: string; unit: string; quantity: number; price: number; vatPercent: number; isService: boolean; code: string | null; hint?: string };
export type ClientForm = { name: string; type: "firma" | "persoana"; cui: string; regCom: string; address: string; city: string; county: string; email: string; phone: string; vatPayer: boolean };

const field = "w-full rounded-[10px] border border-[#d0d5dd] bg-white px-3 py-2 text-[13.5px] outline-none focus:border-electric";
const lbl = "mb-1 block text-[12px] font-semibold text-[#344054]";

function splitAddress(a: string | null) {
  const parts = (a ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  if (parts.length >= 3 && /^(jud\.?|județul|judetul)?\s*[A-ZĂÂÎȘȚ]/i.test(parts[parts.length - 1]) && parts[parts.length - 1].split(" ").length <= 3 && parts.length > 2) {
    return { address: parts.slice(0, -2).join(", "), city: parts[parts.length - 2], county: parts[parts.length - 1].replace(/^jud(e[tț]ul)?\.?\s*/i, "") };
  }
  if (parts.length >= 2) return { address: parts.slice(0, -1).join(", "), city: parts[parts.length - 1], county: "" };
  return { address: parts[0] ?? "", city: "", county: "" };
}

function fromClient(c: EditorClient | undefined): ClientForm {
  const a = splitAddress(c?.address ?? null);
  const cui = c?.cui ?? "";
  return { name: c?.name ?? "", type: cui || c?.type === "company" ? "firma" : "persoana", cui, regCom: "", address: a.address, city: a.city, county: a.county, email: c?.email ?? "", phone: c?.phone ?? "", vatPayer: /^RO/i.test(cui) };
}

export function InvoiceEditor({
  mode, providerLabel, clients, initial, catalog, defaults, jobs, jobLabel, proformaLabel, catalogError, clientOverride,
}: {
  mode: "real" | "demo" | "intern";
  providerLabel: string | null;
  clients: EditorClient[];
  initial: { docType: "factura" | "proforma"; clientId: string; jobId: string | null; fromProformaId: string | null; lines: EditorLine[]; mentions: string; collect: { method: "numerar" | "card" | "ordin_plata" | "alta"; amount: number } | null };
  catalog: { invoiceSeries: string[]; proformaSeries: string[]; vatRates: { name: string; percent: number }[]; hasReceiptSeries: boolean };
  defaults: { vat: number; dueDays: number; sendEmail: boolean; today: string; series: string; proformaSeries: string | null };
  jobs: { id: string; label: string }[];
  jobLabel: string | null;
  proformaLabel: string | null;
  catalogError?: string;
  /** Datele clientului de pe proforma din care se emite factura (au prioritate față de fișa clientului). */
  clientOverride?: ClientForm | null;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState | undefined, FormData>(issueAction, undefined);
  const [docType, setDocType] = useState(initial.docType);
  const [clientId, setClientId] = useState(initial.clientId);
  const [client, setClient] = useState<ClientForm>(() => clientOverride ?? fromClient(clients.find((c) => c.id === initial.clientId)));
  const [lines, setLines] = useState<EditorLine[]>(initial.lines.length ? initial.lines : [{ name: "", unit: "buc", quantity: 1, price: 0, vatPercent: defaults.vat, isService: true, code: null }]);
  const [issueDate, setIssueDate] = useState(defaults.today);
  const [dueDate, setDueDate] = useState(addDays(defaults.today, defaults.dueDays));
  const invoiceSeries = catalog.invoiceSeries.length ? catalog.invoiceSeries : [defaults.series];
  const proformaSeries = catalog.proformaSeries.length ? catalog.proformaSeries : defaults.proformaSeries ? [defaults.proformaSeries] : [];
  const [series, setSeries] = useState(initial.docType === "proforma" ? proformaSeries[0] ?? "" : (invoiceSeries.includes(defaults.series) ? defaults.series : invoiceSeries[0]));
  const [mentions, setMentions] = useState(initial.mentions);
  const [sendEmail, setSendEmail] = useState(defaults.sendEmail && mode !== "intern");
  const [collectOn, setCollectOn] = useState(Boolean(initial.collect));
  const [collectMethod, setCollectMethod] = useState(initial.collect?.method ?? "numerar");
  const [collectAmount, setCollectAmount] = useState<string>(initial.collect ? String(initial.collect.amount) : "");
  const [collectDoc, setCollectDoc] = useState("");
  const [anaf, setAnaf] = useState<{ busy: boolean; msg?: string; err?: boolean }>({ busy: false });
  const [, startTransition] = useTransition();

  const sum = useMemo(() => totals(lines.map((l) => ({ quantity: Number(l.quantity) || 0, price: Number(l.price) || 0, vatPercent: Number(l.vatPercent) || 0, isService: l.isService }))), [lines]);
  const vatOptions = useMemo(() => {
    const set = new Map<number, string>();
    for (const r of catalog.vatRates) if (!set.has(r.percent)) set.set(r.percent, r.name);
    for (const l of lines) if (!set.has(l.vatPercent)) set.set(l.vatPercent, `${l.vatPercent}%`);
    return [...set.entries()].sort((a, b) => b[0] - a[0]);
  }, [catalog.vatRates, lines]);

  useEffect(() => {
    // Seria urmează tipul documentului.
    setSeries(docType === "proforma" ? proformaSeries[0] ?? "" : (invoiceSeries.includes(defaults.series) ? defaults.series : invoiceSeries[0]));
    if (docType === "proforma") setCollectOn(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docType]);

  const setLine = (i: number, patch: Partial<EditorLine>) => setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch, hint: patch.price !== undefined || patch.quantity !== undefined ? undefined : l.hint } : l)));
  const pickClient = (id: string) => { setClientId(id); setClient(fromClient(clients.find((c) => c.id === id))); setAnaf({ busy: false }); };

  async function askAnaf() {
    setAnaf({ busy: true });
    const r = await lookupCompany(client.cui);
    if (!r.company) { setAnaf({ busy: false, msg: r.error ?? "Nu am găsit firma.", err: true }); return; }
    const c = r.company;
    setClient((x) => ({ ...x, type: "firma", name: c.name || x.name, cui: c.vatPayer ? `RO${c.cui}` : c.cui, regCom: c.regCom ?? x.regCom, address: c.address ?? x.address, city: c.city ?? x.city, county: c.county ?? x.county, phone: x.phone || c.phone || "", vatPayer: c.vatPayer }));
    setAnaf({ busy: false, msg: `${c.name} · ${c.vatPayer ? "plătitor de TVA" : "neplătitor de TVA"}${c.inactive ? " · ATENȚIE: inactiv fiscal" : ""}${c.eInvoice ? " · înscris în e-Factura" : ""}`, err: c.inactive });
  }

  const payload = JSON.stringify({
    docType, clientId, client, jobId: initial.jobId, fromProformaId: initial.fromProformaId, series, issueDate, dueDate, mentions, sendEmail,
    collect: docType === "factura" && collectOn ? { method: collectMethod, amount: Number(String(collectAmount).replace(",", ".")) || sum.gross, document: collectDoc } : null,
    lines: lines.map((l) => ({ name: l.name, unit: l.unit, quantity: Number(l.quantity), price: Number(l.price), vatPercent: Number(l.vatPercent), isService: l.isService, code: l.code })),
  });

  const submitLabel = docType === "proforma" ? "Emite proforma" : "Emite factura";
  const where = mode === "real" ? ` în ${providerLabel}` : mode === "demo" ? " (simulat)" : "";

  return (
    <form action={action} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <input type="hidden" name="payload" value={payload} />
      <div className="flex min-w-0 flex-col gap-5">
        {mode === "intern" && (
          <div className="rounded-[13px] border border-[#fec84b] bg-[#fffaeb] p-4 text-[13px] text-[#93370d]">
            <b>Fără furnizor de facturare conectat.</b> Documentul se salvează doar ca evidență internă, nu e factură fiscală și nu ajunge în e-Factura. Conectează SmartBill sau Oblio din Setări → Integrări ca factura să se emită direct de aici.
          </div>
        )}
        {catalogError && <div className="rounded-[13px] bg-warning-bg p-3 text-[12.5px] font-semibold text-warning">{catalogError} Folosesc seriile și cotele salvate.</div>}

        <section className="rounded-[14px] border border-border bg-white p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-extrabold">Client</h2>
            {(jobLabel || proformaLabel) && <span className="rounded-full bg-neutral-bg px-2.5 py-1 text-[11.5px] font-bold text-muted">{proformaLabel ? `Din proforma ${proformaLabel}` : `Din lucrarea ${jobLabel}`}</span>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={lbl} htmlFor="inv-client">Alege clientul</label>
              <select id="inv-client" value={clientId} onChange={(e) => pickClient(e.target.value)} className={field} required>
                <option value="" disabled>Alege din clienții tăi…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.cui ? ` · ${c.cui}` : ""}</option>)}
              </select>
            </div>
            {clientId && (
              <>
                <div className="flex gap-1 rounded-full border border-border bg-neutral-bg p-1 sm:col-span-2 sm:w-fit" role="group" aria-label="Tip client">
                  {([["firma", "Firmă", Building2], ["persoana", "Persoană fizică", User]] as const).map(([v, t, Icon]) => (
                    <button key={v} type="button" aria-pressed={client.type === v} onClick={() => setClient((x) => ({ ...x, type: v }))}
                      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold ${client.type === v ? "bg-[#101828] text-white" : "text-[#344054]"}`}><Icon className="h-3.5 w-3.5" /> {t}</button>
                  ))}
                </div>
                {client.type === "firma" && (
                  <div className="sm:col-span-2">
                    <label className={lbl} htmlFor="inv-cui">CUI / CIF</label>
                    <div className="flex gap-2">
                      <input id="inv-cui" value={client.cui} onChange={(e) => setClient((x) => ({ ...x, cui: e.target.value }))} placeholder="RO12345678" className={field} />
                      <button type="button" onClick={askAnaf} disabled={anaf.busy || client.cui.replace(/\D/g, "").length < 2} className="flex shrink-0 items-center gap-1.5 rounded-[10px] border border-[#d0d5dd] bg-white px-3 text-[12.5px] font-bold disabled:opacity-50">
                        {anaf.busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Completează de la ANAF
                      </button>
                    </div>
                    {anaf.msg && <p className={`mt-1.5 text-[12px] font-semibold ${anaf.err ? "text-danger" : "text-success"}`}>{anaf.msg}</p>}
                  </div>
                )}
                <div className={client.type === "firma" ? "" : "sm:col-span-2"}><label className={lbl} htmlFor="inv-name">{client.type === "firma" ? "Denumire firmă" : "Nume și prenume"}</label><input id="inv-name" value={client.name} onChange={(e) => setClient((x) => ({ ...x, name: e.target.value }))} className={field} required /></div>
                {client.type === "firma" && <div><label className={lbl} htmlFor="inv-rc">Nr. Registrul Comerțului</label><input id="inv-rc" value={client.regCom} onChange={(e) => setClient((x) => ({ ...x, regCom: e.target.value }))} placeholder="J12/123/2020" className={field} /></div>}
                <div className="sm:col-span-2"><label className={lbl} htmlFor="inv-addr">Adresă (stradă, număr)</label><input id="inv-addr" value={client.address} onChange={(e) => setClient((x) => ({ ...x, address: e.target.value }))} className={field} required /></div>
                <div><label className={lbl} htmlFor="inv-city">Localitate</label><input id="inv-city" value={client.city} onChange={(e) => setClient((x) => ({ ...x, city: e.target.value }))} className={field} required /></div>
                <div><label className={lbl} htmlFor="inv-county">Județ</label><input id="inv-county" value={client.county} onChange={(e) => setClient((x) => ({ ...x, county: e.target.value }))} className={field} /></div>
                <div><label className={lbl} htmlFor="inv-email">E-mail</label><input id="inv-email" type="email" value={client.email} onChange={(e) => setClient((x) => ({ ...x, email: e.target.value }))} className={field} /></div>
                <div><label className={lbl} htmlFor="inv-phone">Telefon</label><input id="inv-phone" value={client.phone} onChange={(e) => setClient((x) => ({ ...x, phone: e.target.value }))} className={field} /></div>
                {client.type === "firma" && <label className="flex items-center gap-2 text-[13px] font-semibold sm:col-span-2"><input type="checkbox" checked={client.vatPayer} onChange={(e) => setClient((x) => ({ ...x, vatPayer: e.target.checked }))} className="h-4 w-4" /> Clientul e plătitor de TVA</label>}
              </>
            )}
          </div>
        </section>

        <section className="rounded-[14px] border border-border bg-white p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-extrabold">Ce facturezi</h2>
            {!jobLabel && !proformaLabel && jobs.length > 0 && (
              <select defaultValue="" onChange={(e) => e.target.value && startTransition(() => router.push(`/facturare/noua?job=${e.target.value}${docType === "proforma" ? "&tip=proforma" : ""}`))} className="rounded-[10px] border border-[#d0d5dd] bg-white px-3 py-1.5 text-[12.5px] font-semibold" aria-label="Completează din lucrare">
                <option value="">Completează dintr-o lucrare terminată…</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.label}</option>)}
              </select>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[13px]">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                  <th className="pb-2 pr-2">Denumire</th><th className="w-[64px] pb-2 pr-2">UM</th><th className="w-[84px] pb-2 pr-2 text-right">Cant.</th><th className="w-[104px] pb-2 pr-2 text-right">Preț fără TVA</th><th className="w-[84px] pb-2 pr-2">TVA</th><th className="w-[92px] pb-2 text-right">Valoare</th><th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i} className="align-top">
                    <td className="py-1 pr-2">
                      <ProductInput value={l.name} onChange={(name) => setLine(i, { name })} onPick={(p) => setLine(i, { name: p.name, unit: p.unit, price: p.price, isService: p.isService, code: p.code, ...(p.vatPercent !== null ? { vatPercent: p.vatPercent } : {}) })} />
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <select value={l.isService ? "s" : "m"} onChange={(e) => setLine(i, { isService: e.target.value === "s" })} className="rounded-[7px] border border-[#e4e7ec] bg-white px-1.5 py-0.5 text-[11.5px] font-semibold text-[#475467]" aria-label="Serviciu sau marfă">
                          <option value="s">Serviciu</option><option value="m">Marfă</option>
                        </select>
                        {l.hint && <span className="text-[11px] font-semibold text-warning">{l.hint}</span>}
                      </div>
                    </td>
                    <td className="py-1 pr-2"><input value={l.unit} onChange={(e) => setLine(i, { unit: e.target.value })} className={field} aria-label="Unitate de măsură" /></td>
                    <td className="py-1 pr-2"><input type="number" step="0.01" min="0" value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value as unknown as number })} className={`${field} text-right tabular-nums`} aria-label="Cantitate" /></td>
                    <td className="py-1 pr-2"><input type="number" step="0.01" min="0" value={l.price} onChange={(e) => setLine(i, { price: e.target.value as unknown as number })} className={`${field} text-right tabular-nums`} aria-label="Preț unitar fără TVA" /></td>
                    <td className="py-1 pr-2">
                      <select value={l.vatPercent} onChange={(e) => setLine(i, { vatPercent: Number(e.target.value) })} className={field} aria-label="Cota TVA">
                        {vatOptions.map(([p]) => <option key={p} value={p}>{p}%</option>)}
                      </select>
                    </td>
                    <td className="py-1 pr-1 pt-3 text-right font-bold tabular-nums">{(Math.round((Number(l.quantity) || 0) * (Number(l.price) || 0) * 100) / 100).toLocaleString("ro-RO", { minimumFractionDigits: 2 })}</td>
                    <td className="py-1 pt-2 text-right">
                      <button type="button" onClick={() => setLines((ls) => ls.filter((_, k) => k !== i))} disabled={lines.length === 1} aria-label="Șterge rândul" className="rounded-[8px] p-1.5 text-muted-2 hover:bg-danger-bg hover:text-danger disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={() => setLines((ls) => [...ls, { name: "", unit: "buc", quantity: 1, price: 0, vatPercent: defaults.vat, isService: true, code: null }])} className="mt-2 flex items-center gap-1.5 rounded-[10px] px-2 py-1.5 text-[13px] font-bold text-electric hover:bg-electric-soft">
            <Plus className="h-4 w-4" /> Adaugă rând
          </button>
          <div className="mt-4">
            <label className={lbl} htmlFor="inv-mentions">Mențiuni pe document (opțional)</label>
            <input id="inv-mentions" value={mentions} onChange={(e) => setMentions(e.target.value)} maxLength={500} placeholder="ex. Lucrarea #145, conform devizului acceptat" className={field} />
          </div>
        </section>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
        <section className="rounded-[14px] border border-border bg-white p-5">
          <div className="mb-3 flex gap-1 rounded-full border border-border bg-neutral-bg p-1" role="group" aria-label="Tip document">
            {([["factura", "Factură"], ["proforma", "Proformă"]] as const).map(([v, t]) => (
              <button key={v} type="button" aria-pressed={docType === v} disabled={(v === "proforma" && (!proformaSeries.length || Boolean(initial.fromProformaId)))} onClick={() => setDocType(v)}
                title={v === "proforma" && !proformaSeries.length ? "Adaugă seria de proforme în Setări → Integrări" : undefined}
                className={`flex-1 rounded-full px-3 py-1.5 text-[13px] font-bold disabled:opacity-40 ${docType === v ? "bg-[#101828] text-white" : "text-[#344054]"}`}>{t}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className={lbl} htmlFor="inv-series">Serie</label>
              <select id="inv-series" value={series} onChange={(e) => setSeries(e.target.value)} className={field}>
                {(docType === "proforma" ? proformaSeries : invoiceSeries).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className={lbl} htmlFor="inv-date">Data</label><input id="inv-date" type="date" value={issueDate} onChange={(e) => { setIssueDate(e.target.value); if (dueDate < e.target.value) setDueDate(e.target.value); }} className={field} /></div>
            <div><label className={lbl} htmlFor="inv-due">Scadența</label><input id="inv-due" type="date" value={dueDate} min={issueDate} onChange={(e) => setDueDate(e.target.value)} className={field} /></div>
          </div>
        </section>

        {docType === "factura" && (
          <section className="rounded-[14px] border border-border bg-white p-5">
            <label className="flex items-center gap-2 text-[13.5px] font-bold"><input type="checkbox" checked={collectOn} onChange={(e) => setCollectOn(e.target.checked)} className="h-4 w-4" /> Încasată acum</label>
            {collectOn && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className={lbl} htmlFor="inv-pm">Cum</label>
                  <select id="inv-pm" value={collectMethod} onChange={(e) => setCollectMethod(e.target.value as typeof collectMethod)} className={field}>
                    <option value="numerar">Numerar{catalog.hasReceiptSeries ? " (cu chitanță)" : ""}</option><option value="card">Card</option><option value="ordin_plata">Ordin de plată</option><option value="alta">Altă încasare</option>
                  </select>
                </div>
                <div><label className={lbl} htmlFor="inv-pa">Suma (lei)</label><input id="inv-pa" type="number" step="0.01" min="0" value={collectAmount} placeholder={sum.gross.toFixed(2)} onChange={(e) => setCollectAmount(e.target.value)} className={`${field} tabular-nums`} /></div>
                <div><label className={lbl} htmlFor="inv-pd">Nr. document</label><input id="inv-pd" value={collectDoc} onChange={(e) => setCollectDoc(e.target.value)} placeholder={collectMethod === "ordin_plata" ? "OP 123" : "opțional"} className={field} /></div>
              </div>
            )}
          </section>
        )}

        {mode !== "intern" && (
          <section className="rounded-[14px] border border-border bg-white p-5">
            <label className="flex items-center gap-2 text-[13.5px] font-bold"><input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="h-4 w-4" /> Trimite clientului pe e-mail</label>
            {sendEmail && !client.email && <p className="mt-1.5 text-[12px] font-semibold text-warning">Completează e-mailul clientului.</p>}
          </section>
        )}

        <section className="rounded-[14px] border border-border bg-white p-5">
          <dl className="flex flex-col gap-1.5 text-[13px]">
            <div className="flex justify-between"><dt className="text-muted">Fără TVA</dt><dd className="font-semibold tabular-nums">{lei(sum.net)}</dd></div>
            {sum.byRate.map((b) => <div key={b.rate} className="flex justify-between"><dt className="text-muted">TVA {b.rate}%</dt><dd className="font-semibold tabular-nums">{lei(b.vat)}</dd></div>)}
            <div className="mt-1 flex justify-between border-t border-border pt-2 text-[16px]"><dt className="font-extrabold">Total</dt><dd className="font-extrabold tabular-nums">{lei(sum.gross)}</dd></div>
          </dl>
          <button type="submit" disabled={pending || !clientId || !series} className="mt-4 flex w-full items-center justify-center gap-2 rounded-[11px] bg-electric px-4 py-3 text-[14px] font-extrabold disabled:opacity-50">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} {pending ? "Se emite…" : mode === "intern" ? `Salvează ${docType === "proforma" ? "proforma" : "factura"} (internă)` : `${submitLabel}${where}`}
          </button>
          {state?.error && <p role="alert" className="mt-3 rounded-[10px] bg-danger-bg p-3 text-[12.5px] font-semibold text-danger">{state.error}</p>}
          <p className="mt-3 text-[11.5px] leading-relaxed text-muted-2">
            {mode === "real" ? `Numărul fiscal îl dă ${providerLabel}. După emitere documentul nu se mai modifică: se anulează sau se stornează.` : mode === "demo" ? "Cont demonstrativ: nu se trimite nimic la furnizor; numerele sunt de test." : "Evidență internă, fără valoare fiscală."}
          </p>
        </section>
      </aside>
    </form>
  );
}

/** Câmpul de denumire cu sugestii din nomenclatorul furnizorului și din materialele firmei. */
function ProductInput({ value, onChange, onPick }: { value: string; onChange: (v: string) => void; onPick: (p: Product) => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Product[]>([]);
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | null>(null);
  const seq = useRef(0);

  function search(q: string) {
    if (timer.current) window.clearTimeout(timer.current);
    if (q.trim().length < 2) { setItems([]); return; }
    timer.current = window.setTimeout(async () => {
      const id = ++seq.current;
      setBusy(true);
      const r = await findProducts(q);
      if (id === seq.current) { setItems(r); setBusy(false); setOpen(true); }
    }, 300);
  }

  return (
    <div className="relative">
      <input value={value} onChange={(e) => { onChange(e.target.value); search(e.target.value); }} onFocus={() => items.length && setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder="ex. Verificare instalație gaze" className={field} aria-label="Denumire" autoComplete="off" required />
      {busy && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-2" />}
      {open && items.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-[11px] border border-border bg-white py-1 shadow-[0_12px_30px_rgba(16,24,40,.14)]">
          {items.map((p, k) => (
            <li key={`${p.source}-${p.name}-${k}`}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(p); setOpen(false); }} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[12.5px] hover:bg-[#f9fafb]">
                <span className="min-w-0"><span className="block truncate font-semibold">{p.name}</span><span className="text-[11px] text-muted">{p.source === "furnizor" ? "din nomenclatorul furnizorului" : "din materialele firmei"} · {p.unit}{p.isService ? " · serviciu" : ""}</span></span>
                <span className="shrink-0 font-bold tabular-nums">{p.price.toFixed(2)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
