import type { Connection, Draft, Issued, PaymentState } from "./types";
import { InvoicingError } from "./types";

// SmartBill Cloud REST API (specificația OpenAPI oficială, citită 2026-11). Auth: Basic e-mail:token.
const BASE = "https://ws.smartbill.ro/SBORO/api";
const TAX_NAMES: Record<number, string | undefined> = { 21: "Normala", 11: "Redusa" };

const auth = (email: string, token: string) => `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;

export function smartbillBody(c: Connection, d: Draft) {
  const taxName = TAX_NAMES[c.taxPercent];
  return {
    companyVatCode: c.vatCode,
    seriesName: c.series,
    client: {
      name: d.client.name, country: "Romania", isTaxPayer: d.client.isTaxPayer,
      ...(d.client.vatCode ? { vatCode: d.client.vatCode } : {}),
      ...(d.client.address ? { address: d.client.address } : {}),
      ...(d.client.city ? { city: d.client.city } : {}),
      ...(d.client.email ? { email: d.client.email } : {}),
    },
    issueDate: d.issueDate,
    dueDate: d.dueDate,
    isDraft: false,
    ...(c.sendEmail && d.client.email ? { sendEmail: true } : {}),
    products: d.lines.map((l) => ({
      name: l.name, measuringUnitName: l.unit, currency: "RON", quantity: l.quantity, price: l.price,
      isTaxIncluded: false, taxPercentage: c.taxPercent, isService: l.isService,
      // For 0% the API requires a case-specific tax name that the spec does not settle for a non-payer: left out, the API's own message is shown.
      ...(taxName ? { taxName } : {}),
    })),
  };
}

async function call(path: string, email: string, token: string, init?: { method?: string; body?: unknown }) {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: init?.method ?? "GET",
      headers: { Authorization: auth(email, token), Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}) },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new InvoicingError("SmartBill nu a răspuns. Încearcă din nou în câteva secunde.");
  }
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try { json = JSON.parse(text) as Record<string, unknown>; } catch { /* HTML error pages (502) are not JSON */ }
  if (res.status === 401 || res.status === 403) throw new InvoicingError("SmartBill a refuzat datele de acces. Verifică e-mailul contului și tokenul API.");
  if (res.status === 429) throw new InvoicingError("SmartBill a limitat apelurile (30 la 10 secunde). Așteaptă 10 minute și reîncearcă.");
  const errorText = typeof json.errorText === "string" ? json.errorText : "";
  if (!res.ok || errorText) {
    const detail = errorText || (Array.isArray(json.errors) ? (json.errors as { message?: string; param?: string }[]).map((e) => e.message ?? e.param).filter(Boolean).join("; ") : "");
    throw new InvoicingError(`SmartBill: ${detail || `eroare ${res.status}`}`);
  }
  return json;
}

export async function smartbillCheck(c: Connection, token: string) {
  const series = await call(`/series?cif=${encodeURIComponent(c.vatCode)}&type=f`, c.accountEmail, token);
  const list = (Array.isArray(series.list) ? series.list : []) as { name?: string }[];
  const names = list.map((s) => s.name).filter((n): n is string => Boolean(n));
  if (names.length && !names.includes(c.series)) throw new InvoicingError(`Seria „${c.series}” nu există în SmartBill. Serii găsite: ${names.join(", ")}.`);
  return { series: names };
}

export async function smartbillIssue(c: Connection, token: string, d: Draft): Promise<Issued> {
  const json = await call("/invoice/v2", c.accountEmail, token, { method: "POST", body: smartbillBody(c, d) });
  const number = json.number != null ? String(json.number) : "";
  if (!number) throw new InvoicingError("SmartBill nu a returnat numărul facturii. Verifică factura direct în cont înainte de a reîncerca.");
  return { series: typeof json.series === "string" ? json.series : c.series, number, url: typeof json.url === "string" ? json.url : typeof json.documentUrl === "string" ? json.documentUrl : null };
}

export async function smartbillPayment(c: Connection, token: string, series: string, number: string): Promise<PaymentState> {
  const q = `cif=${encodeURIComponent(c.vatCode)}&seriesname=${encodeURIComponent(series)}&number=${encodeURIComponent(number)}`;
  const json = await call(`/invoice/paymentstatus?${q}`, c.accountEmail, token);
  const unpaid = typeof json.unpaidAmount === "number" ? json.unpaidAmount : null;
  const paid = json.paid === true || (unpaid !== null && unpaid <= 0.01);
  return { paid, paidAmount: typeof json.paidAmount === "number" ? json.paidAmount : null, eInvoice: null };
}
