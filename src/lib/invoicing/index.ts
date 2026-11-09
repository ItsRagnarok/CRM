import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { smartbillCheck, smartbillIssue, smartbillPayment } from "./smartbill";
import { oblioCheck, oblioIssue, oblioPayment } from "./oblio";
import { InvoicingError, type Connection, type Draft, type Issued, type PaymentState, type Provider } from "./types";

export type { Connection, Draft, Issued, PaymentState, Provider } from "./types";
export { InvoicingError } from "./types";
type Db = SupabaseClient<Database>;

export const PROVIDER_LABEL: Record<Provider, string> = { smartbill: "SmartBill", oblio: "Oblio" };

export async function loadConnection(supabase: Db, orgId: string): Promise<Connection | null> {
  const { data } = await supabase.from("invoicing_connections").select("provider, account_email, vat_code, series, default_tax_percent, due_days, send_email, simulated").eq("organization_id", orgId).maybeSingle();
  if (!data) return null;
  return { provider: data.provider as Provider, accountEmail: data.account_email, vatCode: data.vat_code, series: data.series, taxPercent: Number(data.default_tax_percent), dueDays: data.due_days, sendEmail: data.send_email, simulated: data.simulated };
}

async function secret(supabase: Db): Promise<string> {
  const { data, error } = await supabase.rpc("invoicing_get_secret");
  if (error || !data) throw new InvoicingError("Nu am găsit cheia API a furnizorului. Reconectează contul din Setări → Integrări.");
  return data;
}

export async function checkConnection(supabase: Db, c: Connection, override?: string) {
  if (c.simulated) return { series: [c.series] };
  const key = override || (await secret(supabase));
  return c.provider === "smartbill" ? smartbillCheck(c, key) : oblioCheck(c, key);
}

export async function issueInvoice(supabase: Db, c: Connection, d: Draft, orgId: string): Promise<Issued> {
  if (c.simulated) {
    const { data } = await supabase.rpc("next_invoice_number", { p_organization_id: orgId });
    return { series: c.series, number: String(data ?? 0).padStart(4, "0"), url: null };
  }
  const key = await secret(supabase);
  return c.provider === "smartbill" ? smartbillIssue(c, key, d) : oblioIssue(c, key, d);
}

/** Demo invoices are never paid by an outside party, so they stay as they are. */
export async function paymentState(supabase: Db, c: Connection, series: string, number: string): Promise<PaymentState> {
  const key = await secret(supabase);
  return c.provider === "smartbill" ? smartbillPayment(c, key, series, number) : oblioPayment(c, key, series, number);
}
