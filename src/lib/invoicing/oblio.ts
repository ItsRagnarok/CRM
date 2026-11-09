import type { Connection, Draft, Issued, PaymentState } from "./types";
import { InvoicingError } from "./types";

// Oblio API (https://www.oblio.eu/api și SDK-ul oficial). Auth: client_id (e-mailul contului) + client_secret → token Bearer de o oră.
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
  try { json = JSON.parse(text) as Record<string, unknown>; } catch { /* non-JSON error page */ }
  return { res, json };
}

async function token(email: string, secret: string) {
  const asJson = await http("/authorize/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: email, client_secret: secret, grant_type: "client_credentials" }) });
  let { res, json } = asJson;
  if (res.status === 400 || res.status === 415) {
    // The public docs show a form-encoded request, the official SDK sends JSON: try the other form once.
    ({ res, json } = await http("/authorize/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: email, client_secret: secret, grant_type: "client_credentials" }).toString() }));
  }
  const access = typeof json.access_token === "string" ? json.access_token : "";
  if (!res.ok || !access) throw new InvoicingError("Oblio a refuzat datele de acces. Verifică e-mailul contului și Client Secret din Setări → Date cont.");
  return access;
}

async function api(path: string, bearer: string, init?: { method?: string; body?: unknown }) {
  const { res, json } = await http(path, { method: init?.method, headers: { Authorization: `Bearer ${bearer}`, Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}) }, body: init?.body ? JSON.stringify(init.body) : undefined });
  if (res.status === 401) throw new InvoicingError("Oblio a refuzat datele de acces.");
  if (res.status === 429) throw new InvoicingError("Oblio a limitat apelurile. Reîncearcă peste un minut.");
  if (!res.ok) throw new InvoicingError(`Oblio: ${typeof json.statusMessage === "string" && json.statusMessage ? json.statusMessage : `eroare ${res.status}`}`);
  return json;
}

type VatRate = { name?: string; percent?: number };
const rates = (j: Record<string, unknown>) => (Array.isArray(j.data) ? (j.data as VatRate[]) : []);

export function oblioBody(c: Connection, d: Draft, vatName: string) {
  return {
    cif: c.vatCode,
    seriesName: c.series,
    issueDate: d.issueDate,
    dueDate: d.dueDate,
    language: "RO",
    currency: "RON",
    sendEmail: c.sendEmail && d.client.email ? 1 : 0,
    client: {
      name: d.client.name, country: "Romania", vatPayer: d.client.isTaxPayer ? 1 : 0,
      ...(d.client.vatCode ? { cif: d.client.vatCode } : {}),
      ...(d.client.address ? { address: d.client.address } : {}),
      ...(d.client.city ? { city: d.client.city } : {}),
      ...(d.client.email ? { email: d.client.email } : {}),
    },
    // vatIncluded defaults to 1 at Oblio (the opposite of SmartBill), so it is always sent explicitly.
    products: d.lines.map((l) => ({
      name: l.name, measuringUnit: l.unit, quantity: l.quantity, price: l.price, vatName, vatPercentage: c.taxPercent, vatIncluded: 0, productType: l.isService ? "Serviciu" : "Marfa",
    })),
  };
}

export async function oblioCheck(c: Connection, secret: string) {
  const t = await token(c.accountEmail, secret);
  const series = await api(`/nomenclature/series?cif=${encodeURIComponent(c.vatCode)}`, t);
  const names = (Array.isArray(series.data) ? (series.data as { name?: string; type?: string }[]) : []).filter((s) => !s.type || /factur/i.test(s.type)).map((s) => s.name).filter((n): n is string => Boolean(n));
  if (names.length && !names.includes(c.series)) throw new InvoicingError(`Seria „${c.series}” nu există în Oblio. Serii găsite: ${names.join(", ")}.`);
  return { series: names };
}

export async function oblioIssue(c: Connection, secret: string, d: Draft): Promise<Issued> {
  const t = await token(c.accountEmail, secret);
  const vat = rates(await api(`/nomenclature/vat_rates?cif=${encodeURIComponent(c.vatCode)}`, t)).find((r) => Number(r.percent) === c.taxPercent);
  if (!vat?.name) throw new InvoicingError(`Oblio nu are o cotă TVA de ${c.taxPercent}% în cont. Verifică Setări → Cote TVA în Oblio.`);
  const json = await api("/docs/invoice", t, { method: "POST", body: oblioBody(c, d, vat.name) });
  const data = (json.data ?? {}) as { seriesName?: string; number?: string | number; link?: string };
  if (data.number == null || data.number === "") throw new InvoicingError("Oblio nu a returnat numărul facturii. Verifică factura direct în cont înainte de a reîncerca.");
  return { series: data.seriesName ?? c.series, number: String(data.number), url: data.link ?? null };
}

export async function oblioPayment(c: Connection, secret: string, series: string, number: string): Promise<PaymentState> {
  const t = await token(c.accountEmail, secret);
  const json = await api(`/docs/invoice?cif=${encodeURIComponent(c.vatCode)}&seriesName=${encodeURIComponent(series)}&number=${encodeURIComponent(number)}`, t);
  const data = (json.data ?? {}) as { total?: number | string; collected?: number | string | boolean; collects?: { value?: number | string }[]; einvoice?: { status?: number | string } | number | string };
  const collected = (data.collects ?? []).reduce((a, x) => a + Number(x.value ?? 0), 0);
  const total = Number(data.total ?? 0);
  const paid = data.collected === true || data.collected === 1 || data.collected === "1" || (total > 0 && collected >= total - 0.01);
  const e = typeof data.einvoice === "object" && data.einvoice ? data.einvoice.status : data.einvoice;
  const eMap: Record<string, string> = { "-1": "netrimisă", "0": "în prelucrare", "1": "trimisă", "2": "erori" };
  return { paid, paidAmount: collected || null, eInvoice: e != null && eMap[String(e)] ? eMap[String(e)] : null };
}
