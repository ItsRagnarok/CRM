import type { Catalog, Collect, Connection, DocRef, Draft, Issued, PayMethod, PaymentState, Product } from "./types";
import { InvoicingError } from "./types";

// Oblio API (https://www.oblio.eu/api). Auth: client_id (e-mailul contului) + client_secret → token Bearer de o oră.
// Limite: 30 de documente la 100 de secunde; 30 de alte cereri la 10 secunde.
const BASE = "https://www.oblio.eu/api";

async function http(path: string, init: { method?: string; headers?: Record<string, string>; body?: string }) {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { method: init.method ?? "GET", headers: init.headers, body: init.body, signal: AbortSignal.timeout(20_000) });
  } catch {
    throw new InvoicingError("Oblio nu a răspuns. Încearcă din nou în câteva secunde.");
  }
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try { json = JSON.parse(text) as Record<string, unknown>; } catch { /* pagină de eroare care nu e JSON */ }
  return { res, json };
}

async function token(email: string, secret: string) {
  let { res, json } = await http("/authorize/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: email, client_secret: secret, grant_type: "client_credentials" }).toString() });
  if (!res.ok && (res.status === 400 || res.status === 415)) {
    // Documentația arată cererea ca formular; SDK-ul oficial trimite JSON. Încercăm o dată și cealaltă formă.
    ({ res, json } = await http("/authorize/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: email, client_secret: secret, grant_type: "client_credentials" }) }));
  }
  const access = typeof json.access_token === "string" ? json.access_token : "";
  if (!res.ok || !access) throw new InvoicingError("Oblio a refuzat datele de acces. Verifică e-mailul contului și Client Secret din Setări → Date cont.");
  return access;
}

function message(json: Record<string, unknown>, status: number) {
  return typeof json.statusMessage === "string" && json.statusMessage ? json.statusMessage : `eroare ${status}`;
}

async function api(path: string, bearer: string, init?: { method?: string; json?: unknown; form?: Record<string, string> }) {
  const headers: Record<string, string> = { Authorization: `Bearer ${bearer}`, Accept: "application/json" };
  let body: string | undefined;
  if (init?.json) { headers["Content-Type"] = "application/json"; body = JSON.stringify(init.json); }
  if (init?.form) { headers["Content-Type"] = "application/x-www-form-urlencoded"; body = new URLSearchParams(init.form).toString(); }
  const { res, json } = await http(path, { method: init?.method, headers, body });
  if (res.status === 401) throw new InvoicingError("Oblio a refuzat datele de acces.");
  if (res.status === 429) throw new InvoicingError("Oblio a limitat apelurile. Reîncearcă peste un minut.");
  if (!res.ok) throw new InvoicingError(`Oblio: ${message(json, res.status)}`);
  return json;
}

const enc = encodeURIComponent;
type VatRate = { name?: string; percent?: number | string };
const rates = (j: Record<string, unknown>) => (Array.isArray(j.data) ? (j.data as VatRate[]) : []);

/** Tipul încasării în Oblio (valorile permise din documentație). Chitanța cere seria; celelalte, un număr de document. */
export function oblioCollect(m: PayMethod, receiptSeries: string | null, p: Collect, fallbackDoc: string) {
  const type = m === "numerar" ? (receiptSeries ? "Chitanta" : "Alta incasare numerar") : m === "card" ? "Card" : m === "ordin_plata" ? "Ordin de plata" : "Alta incasare banca";
  return {
    type,
    ...(type === "Chitanta" ? { seriesName: receiptSeries! } : { documentNumber: (p.document || fallbackDoc).slice(0, 40) }),
    value: String(p.amount),
    issueDate: p.date,
  };
}

export function oblioBody(c: Connection, d: Draft, vatNames: Map<number, string>) {
  const collect = d.docType === "factura" && d.collect && d.collect.amount > 0 ? oblioCollect(d.collect.method, c.receiptSeries, d.collect, d.series) : null;
  const base = {
    cif: c.vatCode,
    seriesName: d.series,
    issueDate: d.issueDate,
    dueDate: d.dueDate,
    language: "RO",
    currency: "RON",
    sendEmail: d.sendEmail && d.client.email ? 1 : 0,
    ...(d.mentions ? { mentions: d.mentions } : {}),
    ...(collect ? { collect } : {}),
  };
  // Factura din proformă: documentația arată doar trimiterea documentului de referință.
  if (d.fromProforma) return { ...base, referenceDocument: { type: "Proforma", seriesName: d.fromProforma.series, number: d.fromProforma.number } };
  const cl = d.client;
  return {
    ...base,
    client: {
      name: cl.name, country: "Romania", vatPayer: cl.isTaxPayer ? 1 : 0,
      ...(cl.vatCode ? { cif: cl.vatCode } : {}),
      ...(cl.regCom ? { rc: cl.regCom } : {}),
      ...(cl.address ? { address: cl.address } : {}),
      ...(cl.county ? { state: cl.county } : {}),
      ...(cl.city ? { city: cl.city } : {}),
      ...(cl.email ? { email: cl.email } : {}),
      ...(cl.phone ? { phone: cl.phone } : {}),
    },
    // La Oblio, vatIncluded e implicit 1 (invers față de SmartBill), deci îl trimitem mereu explicit.
    products: d.lines.map((l) => ({
      name: l.name, ...(l.code ? { code: l.code } : {}), measuringUnit: l.unit, quantity: l.quantity, price: l.price,
      vatName: vatNames.get(l.vatPercent), vatPercentage: l.vatPercent, vatIncluded: 0, productType: l.isService ? "Serviciu" : "Marfa",
    })),
  };
}

export async function oblioCatalog(c: Connection, secret: string): Promise<Catalog> {
  const t = await token(c.accountEmail, secret);
  const [series, vat] = await Promise.all([api(`/nomenclature/series?cif=${enc(c.vatCode)}`, t), api(`/nomenclature/vat_rates?cif=${enc(c.vatCode)}`, t)]);
  const list = (Array.isArray(series.data) ? series.data : []) as { name?: string; type?: string }[];
  const of = (re: RegExp) => list.filter((s) => re.test(s.type ?? "")).map((s) => s.name).filter((n): n is string => Boolean(n));
  return {
    invoiceSeries: of(/factur/i), proformaSeries: of(/proform/i), receiptSeries: of(/chitan/i),
    vatRates: rates(vat).filter((r) => r.name).map((r) => ({ name: r.name!, percent: Number(r.percent) })),
  };
}

export async function oblioCheck(c: Connection, secret: string) {
  const cat = await oblioCatalog(c, secret);
  if (cat.invoiceSeries.length && !cat.invoiceSeries.includes(c.series)) throw new InvoicingError(`Seria „${c.series}” nu există în Oblio. Serii de factură găsite: ${cat.invoiceSeries.join(", ")}.`);
  return { series: cat.invoiceSeries, catalog: cat };
}

export async function oblioIssue(c: Connection, secret: string, d: Draft): Promise<Issued> {
  const t = await token(c.accountEmail, secret);
  const vat = rates(await api(`/nomenclature/vat_rates?cif=${enc(c.vatCode)}`, t));
  const names = new Map<number, string>();
  for (const r of vat) if (r.name && !names.has(Number(r.percent))) names.set(Number(r.percent), r.name);
  if (!d.fromProforma) {
    const missing = [...new Set(d.lines.map((l) => l.vatPercent))].filter((p) => !names.has(p));
    if (missing.length) throw new InvoicingError(`Oblio nu are cota TVA de ${missing.join("%, ")}% în cont. Verifică Setări → Cote TVA în Oblio.`);
  }
  const json = await api(d.docType === "proforma" ? "/docs/proforma" : "/docs/invoice", t, { method: "POST", json: oblioBody(c, d, names) });
  const data = (json.data ?? {}) as { seriesName?: string; number?: string | number; link?: string };
  if (data.number == null || data.number === "") throw new InvoicingError("Oblio nu a returnat numărul documentului. Verifică direct în cont înainte de a reîncerca.");
  return { series: data.seriesName ?? d.series, number: String(data.number), url: data.link ?? null };
}

const docPath = (d: DocRef) => (d.docType === "proforma" ? "/docs/proforma" : "/docs/invoice");

export async function oblioLink(c: Connection, secret: string, d: DocRef): Promise<string | null> {
  const t = await token(c.accountEmail, secret);
  const json = await api(`${docPath(d)}?cif=${enc(c.vatCode)}&seriesName=${enc(d.series)}&number=${enc(d.number)}`, t);
  const data = (json.data ?? {}) as { link?: string };
  return data.link ?? null;
}

export async function oblioCollectPayment(c: Connection, secret: string, d: DocRef, p: Collect) {
  const t = await token(c.accountEmail, secret);
  const col = oblioCollect(p.method, c.receiptSeries, p, `${d.series}${d.number}`);
  const form: Record<string, string> = { cif: c.vatCode, seriesName: d.series, number: d.number };
  for (const [k, v] of Object.entries(col)) form[`collect[${k}]`] = String(v);
  const json = await api("/docs/invoice/collect", t, { method: "PUT", form });
  const collects = ((json.data ?? {}) as { collects?: { type?: string; number?: string | number }[] }).collects ?? [];
  const last = collects[collects.length - 1];
  return { document: last?.number != null ? `${last.type ?? ""} ${last.number}`.trim() : null };
}

export async function oblioCancel(c: Connection, secret: string, d: DocRef, restore = false) {
  const t = await token(c.accountEmail, secret);
  await api(`${docPath(d)}/${restore ? "restore" : "cancel"}`, t, { method: "PUT", form: { cif: c.vatCode, seriesName: d.series, number: d.number } });
}

/** Storno total: o factură nouă care face referire la cea originală. Încasările originalei rămân (refund 0). */
export async function oblioReverse(c: Connection, secret: string, d: DocRef, issueDate: string): Promise<Issued> {
  const t = await token(c.accountEmail, secret);
  const json = await api("/docs/invoice", t, { method: "POST", json: { cif: c.vatCode, seriesName: c.series, issueDate, referenceDocument: { type: "Factura", refund: 0, seriesName: d.series, number: d.number } } });
  const data = (json.data ?? {}) as { seriesName?: string; number?: string | number; link?: string };
  if (data.number == null || data.number === "") throw new InvoicingError("Oblio nu a returnat numărul stornării. Verifică direct în cont înainte de a reîncerca.");
  return { series: data.seriesName ?? c.series, number: String(data.number), url: data.link ?? null };
}

/** Trimite factura în SPV (e-Factura). Coduri: -1 netrimisă, 0 în prelucrare, 1 trimisă, 2 erori. */
export async function oblioEinvoice(c: Connection, secret: string, d: DocRef) {
  const t = await token(c.accountEmail, secret);
  const json = await api("/docs/einvoice", t, { method: "POST", form: { cif: c.vatCode, seriesName: d.series, number: d.number } });
  const data = (json.data ?? {}) as { text?: string; code?: number | string };
  return einvoiceLabel(data.code) ?? data.text ?? "trimisă";
}

function einvoiceLabel(code: unknown): string | null {
  const map: Record<string, string> = { "-1": "netrimisă", "0": "în prelucrare", "1": "trimisă", "2": "erori" };
  return code != null && map[String(code)] ? map[String(code)] : null;
}

export async function oblioPayment(c: Connection, secret: string, series: string, number: string): Promise<PaymentState> {
  const t = await token(c.accountEmail, secret);
  const [list, view] = await Promise.all([
    api(`/docs/invoice/list?cif=${enc(c.vatCode)}&seriesName=${enc(series)}&number=${enc(number)}&withEinvoiceStatus=1&limitPerPage=1`, t),
    api(`/docs/invoice?cif=${enc(c.vatCode)}&seriesName=${enc(series)}&number=${enc(number)}`, t),
  ]);
  const row = (Array.isArray(list.data) ? (list.data as Record<string, unknown>[]) : [])[0] ?? {};
  const collects = (((view.data ?? {}) as { collects?: { value?: number | string }[] }).collects ?? []);
  const paidAmount = collects.reduce((a, x) => a + Number(x.value ?? 0), 0);
  const total = row.total != null ? Number(row.total) : null;
  const e = row.einvoiceStatus as { code?: number | string; text?: string } | undefined;
  return {
    paid: total !== null && total > 0 && paidAmount >= total - 0.01,
    paidAmount,
    total,
    eInvoice: e ? einvoiceLabel(e.code) ?? e.text ?? null : null,
    cancelled: row.canceled == null ? null : ["1", "true"].includes(String(row.canceled)),
  };
}

export async function oblioProducts(c: Connection, secret: string, name: string): Promise<Product[]> {
  const t = await token(c.accountEmail, secret);
  const json = await api(`/nomenclature/products?cif=${enc(c.vatCode)}${name ? `&name=${enc(name)}` : ""}`, t);
  const items = (Array.isArray(json.data) ? json.data : []) as { name?: string; code?: string; measuringUnit?: string; productType?: string; price?: string | number; vatPercentage?: string | number; vatIncluded?: string | number | boolean }[];
  return items.filter((p) => p.name).slice(0, 20).map((p) => {
    const vat = p.vatPercentage != null && p.vatPercentage !== "" ? Number(p.vatPercentage) : null;
    const price = Number(p.price ?? 0);
    const included = ["1", "true"].includes(String(p.vatIncluded));
    return {
      name: p.name!, code: p.code || null, unit: p.measuringUnit || "buc", isService: /servic/i.test(p.productType ?? ""), vatPercent: vat,
      price: included && vat ? Math.round((price / (1 + vat / 100)) * 100) / 100 : price,
      source: "furnizor" as const,
    };
  });
}
