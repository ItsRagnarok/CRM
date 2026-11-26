import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  smartbillCancel, smartbillCatalog, smartbillCheck, smartbillCollect, smartbillIssue, smartbillPayment, smartbillPdf, smartbillProducts, smartbillReverse, smartbillSendEmail,
} from "./smartbill";
import {
  oblioCancel, oblioCatalog, oblioCheck, oblioCollectPayment, oblioEinvoice, oblioIssue, oblioLink, oblioPayment, oblioProducts, oblioReverse,
} from "./oblio";
import { InvoicingError, type Catalog, type Collect, type Connection, type DocRef, type Draft, type Issued, type PaymentState, type Pdf, type Product, type Provider } from "./types";

export type { Catalog, Collect, Connection, DocRef, DocType, Draft, Issued, Line, PayMethod, PaymentState, Pdf, Product, Provider, ClientData } from "./types";
export { InvoicingError, PAY_LABEL } from "./types";
type Db = SupabaseClient<Database>;

export const PROVIDER_LABEL: Record<Provider, string> = { smartbill: "SmartBill", oblio: "Oblio" };

/** Ce poate face fiecare mod; interfața ascunde ce nu e disponibil, în loc să dea erori. */
export function capabilities(c: Connection | null) {
  const real = Boolean(c && !c.simulated);
  return {
    mode: !c ? ("intern" as const) : c.simulated ? ("demo" as const) : ("real" as const),
    email: Boolean(c && (c.simulated || c.provider === "smartbill")),
    einvoice: Boolean(c && c.provider === "oblio"),
    providerPdf: real,
    products: real,
  };
}

export async function loadConnection(supabase: Db, orgId: string): Promise<Connection | null> {
  const { data } = await supabase.from("invoicing_connections")
    .select("provider, account_email, vat_code, series, proforma_series, receipt_series, default_tax_percent, due_days, send_email, simulated")
    .eq("organization_id", orgId).maybeSingle();
  if (!data) return null;
  return {
    provider: data.provider as Provider, accountEmail: data.account_email, vatCode: data.vat_code, series: data.series,
    proformaSeries: data.proforma_series, receiptSeries: data.receipt_series,
    taxPercent: Number(data.default_tax_percent), dueDays: data.due_days, sendEmail: data.send_email, simulated: data.simulated,
  };
}

async function secret(supabase: Db): Promise<string> {
  const { data, error } = await supabase.rpc("invoicing_get_secret");
  if (error || !data) throw new InvoicingError("Nu am găsit cheia API a furnizorului. Reconectează contul din Setări → Integrări.");
  return data;
}

const DEFAULT_VAT = [21, 11, 0];

/** Seriile și cotele TVA din contul furnizorului (sau valori implicite în demo / fără furnizor). */
export async function loadCatalog(supabase: Db, c: Connection | null): Promise<Catalog & { error?: string }> {
  const fallback = (): Catalog => ({
    invoiceSeries: [c?.series ?? "FACT"],
    proformaSeries: [c?.proformaSeries ?? (c ? `${c.series}-PF` : "PF")],
    receiptSeries: c?.receiptSeries ? [c.receiptSeries] : [],
    vatRates: [...new Set([c?.taxPercent ?? 21, ...DEFAULT_VAT])].map((p) => ({ name: `${p}%`, percent: p })),
  });
  if (!c || c.simulated) return fallback();
  try {
    const key = await secret(supabase);
    const cat = c.provider === "smartbill" ? await smartbillCatalog(c, key) : await oblioCatalog(c, key);
    return { ...cat, vatRates: cat.vatRates.length ? cat.vatRates : fallback().vatRates, invoiceSeries: cat.invoiceSeries.length ? cat.invoiceSeries : [c.series] };
  } catch (e) {
    return { ...fallback(), error: e instanceof InvoicingError ? e.message : "Nu am putut citi seriile și cotele TVA de la furnizor." };
  }
}

export async function checkConnection(supabase: Db, c: Connection, override?: string) {
  if (c.simulated) return { series: [c.series] };
  const key = override || (await secret(supabase));
  return c.provider === "smartbill" ? smartbillCheck(c, key) : oblioCheck(c, key);
}

/** Numerotare locală: demo (simulat) sau evidență internă (fără furnizor). */
async function localNumber(supabase: Db, orgId: string) {
  const { data, error } = await supabase.rpc("next_invoice_number", { p_organization_id: orgId });
  if (error || !data) throw new InvoicingError("Nu am putut genera numărul documentului. Încearcă din nou.");
  return String(data).padStart(4, "0");
}

export async function issueDocument(supabase: Db, c: Connection | null, d: Draft, orgId: string): Promise<Issued> {
  if (!c || c.simulated) return { series: d.series, number: await localNumber(supabase, orgId), url: null };
  const key = await secret(supabase);
  return c.provider === "smartbill" ? smartbillIssue(c, key, d) : oblioIssue(c, key, d);
}

/** PDF-ul furnizorului; null = documentul se generează local (demo sau evidență internă). */
export async function documentPdf(supabase: Db, c: Connection | null, ref: DocRef, storedUrl: string | null): Promise<Pdf | null> {
  if (!c || c.simulated) return null;
  const key = await secret(supabase);
  if (c.provider === "smartbill") return { kind: "bytes", data: await smartbillPdf(c, key, ref) };
  const url = storedUrl ?? (await oblioLink(c, key, ref));
  if (!url) throw new InvoicingError("Oblio nu a trimis linkul documentului.");
  return { kind: "url", url };
}

export async function collectPayment(supabase: Db, c: Connection | null, ref: DocRef, p: Collect): Promise<{ document: string | null }> {
  if (!c || c.simulated) return { document: null };
  const key = await secret(supabase);
  return c.provider === "smartbill" ? smartbillCollect(c, key, ref, p) : oblioCollectPayment(c, key, ref, p);
}

export async function cancelDocument(supabase: Db, c: Connection | null, ref: DocRef, restore = false) {
  if (!c || c.simulated) return;
  const key = await secret(supabase);
  return c.provider === "smartbill" ? smartbillCancel(c, key, ref, restore) : oblioCancel(c, key, ref, restore);
}

export async function reverseInvoice(supabase: Db, c: Connection | null, ref: DocRef, issueDate: string, orgId: string): Promise<Issued> {
  if (!c || c.simulated) return { series: c?.series ?? "FACT", number: await localNumber(supabase, orgId), url: null };
  const key = await secret(supabase);
  return c.provider === "smartbill" ? smartbillReverse(c, key, ref, issueDate) : oblioReverse(c, key, ref, issueDate);
}

export async function emailDocument(supabase: Db, c: Connection | null, ref: DocRef, to: string | null) {
  if (!c) throw new InvoicingError("Fără furnizor de facturare conectat, documentul nu se trimite pe e-mail din platformă.");
  if (c.simulated) return;
  if (c.provider !== "smartbill") throw new InvoicingError("Oblio nu permite trimiterea pe e-mail prin API după emitere. Bifează „Trimite pe e-mail” la emitere sau trimite-l din Oblio.");
  const key = await secret(supabase);
  await smartbillSendEmail(c, key, ref, to);
}

export async function sendEinvoice(supabase: Db, c: Connection | null, ref: DocRef): Promise<string> {
  if (!c || c.provider !== "oblio") throw new InvoicingError("Trimiterea în SPV din platformă e disponibilă cu Oblio. În SmartBill, e-Factura se trimite din setările contului.");
  if (c.simulated) return "trimisă (simulat)";
  const key = await secret(supabase);
  return oblioEinvoice(c, key, ref);
}

export async function paymentState(supabase: Db, c: Connection, series: string, number: string): Promise<PaymentState> {
  const key = await secret(supabase);
  return c.provider === "smartbill" ? smartbillPayment(c, key, series, number) : oblioPayment(c, key, series, number);
}

/** Produse și servicii: din nomenclatorul furnizorului, plus materialele firmei din platformă. */
export async function searchProducts(supabase: Db, c: Connection | null, orgId: string, q: string, markup: number): Promise<Product[]> {
  const term = q.trim().slice(0, 60);
  const [remote, local] = await Promise.all([
    (async () => {
      if (!c || c.simulated) return [] as Product[];
      try {
        const key = await secret(supabase);
        return c.provider === "smartbill" ? await smartbillProducts(c, key, term) : await oblioProducts(c, key, term);
      } catch { return [] as Product[]; }
    })(),
    (async () => {
      let query = supabase.from("materials").select("name, unit, unit_cost").eq("organization_id", orgId).order("name").limit(20);
      if (term) query = query.ilike("name", `%${term.replace(/[%_]/g, "")}%`);
      const { data } = await query;
      return (data ?? []).map((m) => ({
        name: m.name, code: null, unit: m.unit || "buc", isService: false, vatPercent: null,
        price: Math.round(Number(m.unit_cost ?? 0) * (1 + markup / 100) * 100) / 100, source: "materiale" as const,
      }));
    })(),
  ]);
  return [...remote, ...local].slice(0, 30);
}
