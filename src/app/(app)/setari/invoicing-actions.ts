"use server";

import { revalidatePath } from "next/cache";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { InvoicingError, checkConnection, loadConnection, type Provider } from "@/lib/invoicing";

export type InvoicingState = { error?: string; ok?: string };

function read(form: FormData) {
  const provider = form.get("provider") === "oblio" ? "oblio" : "smartbill";
  const accountEmail = String(form.get("accountEmail") ?? "").trim();
  const vatCode = String(form.get("vatCode") ?? "").trim().toUpperCase().replace(/\s+/g, "");
  const series = String(form.get("series") ?? "").trim();
  const dueDays = Math.round(Number(form.get("dueDays") ?? 15));
  const secret = String(form.get("secret") ?? "").trim();
  const sendEmail = form.get("sendEmail") === "on";
  const proformaSeries = String(form.get("proformaSeries") ?? "").trim().slice(0, 20);
  const receiptSeries = String(form.get("receiptSeries") ?? "").trim().slice(0, 20);
  let error: string | undefined;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(accountEmail)) error = "Introdu e-mailul contului de facturare.";
  else if (!/^(RO)?\d{2,10}$/.test(vatCode)) error = "CIF-ul firmei nu pare valid (ex. RO12345678).";
  else if (!series || series.length > 20) error = "Introdu seria de facturare, exact cum e în cont.";
  else if (!Number.isFinite(dueDays) || dueDays < 0 || dueDays > 365) error = "Termenul de plată trebuie să fie între 0 și 365 de zile.";
  return { provider: provider as Provider, accountEmail, vatCode, series, proformaSeries, receiptSeries, dueDays, secret, sendEmail, error };
}

async function adminOnly() {
  const { organization, profile, readOnly } = await requireSessionContext();
  if (readOnly || profile.role !== "admin") return null;
  return organization;
}

export async function testInvoicingConnection(_prev: InvoicingState | undefined, form: FormData): Promise<InvoicingState> {
  const org = await adminOnly();
  if (!org) return { error: "Doar administratorul poate conecta facturarea." };
  const v = read(form);
  if (v.error) return { error: v.error };
  const supabase = await createClient();
  const stored = await loadConnection(supabase, org.id);
  if (!v.secret && !stored) return { error: "Introdu tokenul sau cheia API ca să pot testa." };
  try {
    const result = await checkConnection(supabase, { provider: v.provider, accountEmail: v.accountEmail, vatCode: v.vatCode, series: v.series, proformaSeries: v.proformaSeries || null, receiptSeries: v.receiptSeries || null, taxPercent: Number(org.invoice_vat_percent ?? 21), dueDays: v.dueDays, sendEmail: v.sendEmail, simulated: false }, v.secret || undefined);
    const cat = "catalog" in result ? result.catalog : null;
    const parts = [
      result.series.length ? `serii de factură: ${result.series.join(", ")}` : "",
      cat?.proformaSeries.length ? `proforme: ${cat.proformaSeries.join(", ")}` : "",
      cat?.receiptSeries.length ? `chitanțe: ${cat.receiptSeries.join(", ")}` : "",
      cat?.vatRates.length ? `cote TVA: ${cat.vatRates.map((r) => `${r.percent}%`).join(", ")}` : "",
    ].filter(Boolean);
    const warn = [
      v.proformaSeries && cat && cat.proformaSeries.length && !cat.proformaSeries.includes(v.proformaSeries) ? `Seria de proforme „${v.proformaSeries}” nu există în cont.` : "",
      v.receiptSeries && cat && cat.receiptSeries.length && !cat.receiptSeries.includes(v.receiptSeries) ? `Seria de chitanțe „${v.receiptSeries}” nu există în cont.` : "",
    ].filter(Boolean).join(" ");
    if (warn) return { error: `Conexiunea merge, dar: ${warn} Am găsit ${parts.join("; ")}.` };
    return { ok: `Conexiune reușită. Am găsit ${parts.join("; ") || "contul"}.` };
  } catch (e) {
    return { error: e instanceof InvoicingError ? e.message : "Testul nu a reușit. Încearcă din nou." };
  }
}

export async function saveInvoicingConnection(_prev: InvoicingState | undefined, form: FormData): Promise<InvoicingState> {
  const org = await adminOnly();
  if (!org) return { error: "Doar administratorul poate conecta facturarea." };
  const v = read(form);
  if (v.error) return { error: v.error };
  const supabase = await createClient();
  const { error } = await supabase.rpc("invoicing_save_connection", {
    p_provider: v.provider, p_account_email: v.accountEmail, p_vat_code: v.vatCode, p_series: v.series, p_tax: Number(org.invoice_vat_percent ?? 21), p_due_days: v.dueDays, p_send_email: v.sendEmail, ...(v.secret ? { p_secret: v.secret } : {}),
  });
  if (error) return { error: error.code === "22023" ? "Introdu tokenul sau cheia API a furnizorului." : "Conexiunea nu a putut fi salvată. Încearcă din nou." };
  await supabase.rpc("invoicing_set_series", { p_proforma: v.proformaSeries, p_receipt: v.receiptSeries });
  revalidatePath("/setari");
  revalidatePath("/facturare");
  return { ok: "Conexiune salvată. Facturile se emit acum direct în contul tău." };
}

export async function disconnectInvoicing(): Promise<void> {
  const org = await adminOnly();
  if (!org) return;
  const supabase = await createClient();
  await supabase.rpc("invoicing_disconnect");
  revalidatePath("/setari");
  revalidatePath("/facturare");
}
