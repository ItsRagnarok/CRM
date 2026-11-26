import type { Catalog, Collect, Connection, DocRef, Draft, Issued, PayMethod, PaymentState, Product } from "./types";
import { InvoicingError } from "./types";

// SmartBill Cloud REST API: specificația OpenAPI oficială (api.smartbill.ro/smartbill-api-spec.yaml, actualizată 2026-09).
// Auth V1: Basic e-mail:token. Limită V1: 30 de apeluri la 10 secunde, apoi blocare 10 minute.
const BASE = "https://ws.smartbill.ro/SBORO/api";
const TAX_NAMES: Record<number, string | undefined> = { 21: "Normala", 11: "Redusa" };

const auth = (email: string, token: string) => `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;
const q = (o: Record<string, string>) => new URLSearchParams(o).toString();

/** Tipul încasării în SmartBill (enum din specificație). */
export function smartbillPayType(m: PayMethod, receiptSeries: string | null): { type: string; isCash: boolean } {
  if (m === "numerar") return receiptSeries ? { type: "Chitanta", isCash: true } : { type: "Alta incasare", isCash: true };
  if (m === "card") return { type: "Card", isCash: false };
  if (m === "ordin_plata") return { type: "Ordin plata", isCash: false };
  return { type: "Alta incasare", isCash: false };
}

function clientBody(d: Draft) {
  const c = d.client;
  return {
    name: c.name, country: "Romania", isTaxPayer: c.isTaxPayer,
    ...(c.vatCode ? { vatCode: c.vatCode } : {}),
    ...(c.regCom ? { regCom: c.regCom } : {}),
    ...(c.address ? { address: c.address } : {}),
    ...(c.city ? { city: c.city } : {}),
    ...(c.county ? { county: c.county } : {}),
    ...(c.email ? { email: c.email } : {}),
    ...(c.phone ? { phone: c.phone } : {}),
  };
}

export function smartbillBody(c: Connection, d: Draft, taxNames?: Map<number, string>) {
  const payment = d.docType === "factura" && d.collect && d.collect.amount > 0 ? smartbillPayType(d.collect.method, c.receiptSeries) : null;
  return {
    companyVatCode: c.vatCode,
    seriesName: d.series,
    client: clientBody(d),
    issueDate: d.issueDate,
    dueDate: d.dueDate,
    isDraft: false,
    ...(d.mentions ? { mentions: d.mentions } : {}),
    ...(d.sendEmail && d.client.email ? { sendEmail: true, email: { to: d.client.email } } : {}),
    products: d.lines.map((l) => {
      const taxName = taxNames?.get(l.vatPercent) ?? TAX_NAMES[l.vatPercent];
      return {
        name: l.name, ...(l.code ? { code: l.code } : {}), measuringUnitName: l.unit, currency: "RON", quantity: l.quantity, price: l.price,
        isTaxIncluded: false, taxPercentage: l.vatPercent, isService: l.isService,
        // Cota 0 (neplătitor, scutit) are un nume specific contului: îl luăm din /tax; lipsă, se afișează mesajul API-ului.
        ...(taxName ? { taxName } : {}),
      };
    }),
    ...(payment && d.collect
      ? { payment: { value: d.collect.amount, type: payment.type, isCash: payment.isCash, ...(payment.type === "Chitanta" && c.receiptSeries ? { paymentSeries: c.receiptSeries } : {}) }, paymentDate: d.collect.date }
      : {}),
    ...(d.fromProforma ? { useEstimateDetails: true, estimate: { seriesName: d.fromProforma.series, number: d.fromProforma.number } } : {}),
  };
}

async function request(path: string, email: string, token: string, init?: { method?: string; body?: unknown; bearer?: boolean }) {
  try {
    return await fetch(`${BASE}${path}`, {
      method: init?.method ?? "GET",
      headers: { Authorization: init?.bearer ? `Bearer ${token}` : auth(email, token), Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}) },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new InvoicingError("SmartBill nu a răspuns. Încearcă din nou în câteva secunde.");
  }
}

async function call(path: string, email: string, token: string, init?: { method?: string; body?: unknown }) {
  const res = await request(path, email, token, init);
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try { json = JSON.parse(text) as Record<string, unknown>; } catch { /* paginile de eroare (502) nu sunt JSON */ }
  if (res.status === 401 || res.status === 403) throw new InvoicingError("SmartBill a refuzat datele de acces. Verifică e-mailul contului și tokenul API.");
  if (res.status === 429) throw new InvoicingError("SmartBill a limitat apelurile (30 la 10 secunde). Așteaptă 10 minute și reîncearcă.");
  const errorText = typeof json.errorText === "string" ? json.errorText : "";
  const status = json.status as { code?: number; message?: string } | undefined;
  if (!res.ok || errorText || (status && status.code === 1)) {
    const detail = errorText || status?.message || (Array.isArray(json.errors) ? (json.errors as { message?: string; param?: string }[]).map((e) => e.message ?? e.param).filter(Boolean).join("; ") : "");
    throw new InvoicingError(`SmartBill: ${detail || `eroare ${res.status}`}`);
  }
  return json;
}

const path = (d: DocRef, what: string) => `/${d.docType === "proforma" ? "estimate" : "invoice"}/${what}`;
const refQuery = (c: Connection, d: DocRef) => q({ cif: c.vatCode, seriesname: d.series, number: d.number });

export async function smartbillCatalog(c: Connection, token: string): Promise<Catalog> {
  const [series, taxes] = await Promise.all([call(`/series?${q({ cif: c.vatCode })}`, c.accountEmail, token), call(`/tax?${q({ cif: c.vatCode })}`, c.accountEmail, token)]);
  const list = (Array.isArray(series.list) ? series.list : []) as { name?: string; type?: string }[];
  const of = (t: string) => list.filter((s) => s.type === t).map((s) => s.name).filter((n): n is string => Boolean(n));
  const vat = (Array.isArray(taxes.taxes) ? taxes.taxes : []) as { name?: string; percentage?: number }[];
  return {
    invoiceSeries: of("f"), proformaSeries: of("p"), receiptSeries: of("c"),
    vatRates: vat.filter((v) => typeof v.percentage === "number").map((v) => ({ name: v.name ?? `${v.percentage}%`, percent: Number(v.percentage) })),
  };
}

export async function smartbillCheck(c: Connection, token: string) {
  const cat = await smartbillCatalog(c, token);
  if (cat.invoiceSeries.length && !cat.invoiceSeries.includes(c.series)) throw new InvoicingError(`Seria „${c.series}” nu există în SmartBill. Serii de factură găsite: ${cat.invoiceSeries.join(", ")}.`);
  return { series: cat.invoiceSeries, catalog: cat };
}

export async function smartbillIssue(c: Connection, token: string, d: Draft): Promise<Issued> {
  let taxNames: Map<number, string> | undefined;
  if (d.lines.some((l) => !TAX_NAMES[l.vatPercent])) {
    // Cote fără nume standard (de ex. 0% la firmă neplătitoare de TVA): numele exact din contul SmartBill.
    const taxes = await call(`/tax?${q({ cif: c.vatCode })}`, c.accountEmail, token);
    taxNames = new Map();
    for (const t of (Array.isArray(taxes.taxes) ? taxes.taxes : []) as { name?: string; percentage?: number }[]) {
      if (t.name && typeof t.percentage === "number" && !taxNames.has(Number(t.percentage))) taxNames.set(Number(t.percentage), t.name);
    }
  }
  const json = await call(d.docType === "proforma" ? "/estimate/v2" : "/invoice/v2", c.accountEmail, token, { method: "POST", body: smartbillBody(c, d, taxNames) });
  const number = json.number != null ? String(json.number) : "";
  if (!number) throw new InvoicingError("SmartBill nu a returnat numărul documentului. Verifică direct în cont înainte de a reîncerca.");
  const view = typeof json.documentViewUrl === "string" && json.documentViewUrl ? json.documentViewUrl : null;
  return { series: typeof json.series === "string" && json.series ? json.series : d.series, number, url: view };
}

export async function smartbillPdf(c: Connection, token: string, d: DocRef): Promise<ArrayBuffer> {
  const res = await request(`${path(d, "pdf")}?${refQuery(c, d)}`, c.accountEmail, token);
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || type.includes("json")) {
    let msg = "";
    try { msg = String(((await res.json()) as { errorText?: string }).errorText ?? ""); } catch { /* */ }
    throw new InvoicingError(`SmartBill nu a trimis PDF-ul${msg ? `: ${msg}` : "."}`);
  }
  return res.arrayBuffer();
}

export async function smartbillCollect(c: Connection, token: string, d: DocRef, p: Collect) {
  const t = smartbillPayType(p.method, c.receiptSeries);
  const json = await call("/payment", c.accountEmail, token, {
    method: "POST",
    body: {
      companyVatCode: c.vatCode, type: t.type, isCash: t.isCash, issueDate: p.date, value: p.amount, useInvoiceDetails: true,
      ...(t.type === "Chitanta" && c.receiptSeries ? { seriesName: c.receiptSeries } : {}),
      ...(p.document ? { observation: p.document } : {}),
      invoicesList: [{ seriesName: d.series, number: d.number }],
    },
  });
  const series = typeof json.series === "string" ? json.series : "";
  const number = json.number != null ? String(json.number) : "";
  return { document: number ? `${t.type === "Chitanta" ? "Chitanța " : ""}${series} ${number}`.trim() : null };
}

export async function smartbillCancel(c: Connection, token: string, d: DocRef, restore = false) {
  await call(`${path(d, restore ? "restore" : "cancel")}?${refQuery(c, d)}`, c.accountEmail, token, { method: "PUT" });
}

export async function smartbillReverse(c: Connection, token: string, d: DocRef, issueDate: string): Promise<Issued> {
  const json = await call("/invoice/reverse", c.accountEmail, token, { method: "POST", body: { companyVatCode: c.vatCode, seriesName: d.series, number: d.number, issueDate } });
  const number = json.number != null ? String(json.number) : "";
  if (!number) throw new InvoicingError("SmartBill nu a returnat numărul stornării. Verifică direct în cont înainte de a reîncerca.");
  return { series: typeof json.series === "string" && json.series ? json.series : d.series, number, url: typeof json.documentViewUrl === "string" && json.documentViewUrl ? json.documentViewUrl : null };
}

export async function smartbillSendEmail(c: Connection, token: string, d: DocRef, to: string | null) {
  await call("/document/send", c.accountEmail, token, {
    method: "POST",
    body: { companyVatCode: c.vatCode, seriesName: d.series, number: d.number, type: d.docType === "proforma" ? "proforma" : "factura", ...(to ? { to } : {}) },
  });
}

export async function smartbillPayment(c: Connection, token: string, series: string, number: string): Promise<PaymentState> {
  const json = await call(`/invoice/paymentstatus?${q({ cif: c.vatCode, seriesname: series, number })}`, c.accountEmail, token);
  const unpaid = typeof json.unpaidAmount === "number" ? json.unpaidAmount : null;
  const paid = json.paid === true || (unpaid !== null && unpaid <= 0.01);
  return {
    paid,
    paidAmount: typeof json.paidAmount === "number" ? json.paidAmount : null,
    total: typeof json.invoiceTotalAmount === "number" ? json.invoiceTotalAmount : null,
    eInvoice: null,
    cancelled: null,
  };
}

/** Nomenclatorul de produse (API V3, Bearer). Dacă tokenul nu are acces la V3, întoarcem o listă goală. */
export async function smartbillProducts(c: Connection, token: string, name: string): Promise<Product[]> {
  const cif = c.vatCode.replace(/\s+/g, "");
  const res = await request(`/v3/companies/${encodeURIComponent(cif)}/products?${q({ ...(name ? { name } : {}), limit: "20" })}`, c.accountEmail, token, { bearer: true }).catch(() => null);
  if (!res || !res.ok) return [];
  const json = (await res.json().catch(() => ({}))) as { items?: { name?: string; code?: string; isService?: boolean; price?: number; measuringUnitName?: string; vatPercentage?: number; isVatIncluded?: boolean }[] };
  return (json.items ?? []).filter((p) => p.name).map((p) => {
    const vat = typeof p.vatPercentage === "number" ? p.vatPercentage : null;
    const price = Number(p.price ?? 0);
    return {
      name: p.name!, code: p.code || null, unit: p.measuringUnitName || "buc", isService: Boolean(p.isService), vatPercent: vat,
      price: p.isVatIncluded && vat ? Math.round((price / (1 + vat / 100)) * 100) / 100 : price,
      source: "furnizor" as const,
    };
  });
}
