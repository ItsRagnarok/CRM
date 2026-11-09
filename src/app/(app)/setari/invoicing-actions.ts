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
  const taxPercent = Number(form.get("taxPercent") ?? 21);
  const dueDays = Math.round(Number(form.get("dueDays") ?? 15));
  const secret = String(form.get("secret") ?? "").trim();
  const sendEmail = form.get("sendEmail") === "on";
  let error: string | undefined;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(accountEmail)) error = "Introdu e-mailul contului de facturare.";
  else if (!/^(RO)?\d{2,10}$/.test(vatCode)) error = "CIF-ul firmei nu pare valid (ex. RO12345678).";
  else if (!series || series.length > 20) error = "Introdu seria de facturare, exact cum e în cont.";
  else if (!Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100) error = "Cota TVA nu e validă.";
  else if (!Number.isFinite(dueDays) || dueDays < 0 || dueDays > 365) error = "Termenul de plată trebuie să fie între 0 și 365 de zile.";
  return { provider: provider as Provider, accountEmail, vatCode, series, taxPercent, dueDays, secret, sendEmail, error };
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
    const result = await checkConnection(supabase, { provider: v.provider, accountEmail: v.accountEmail, vatCode: v.vatCode, series: v.series, taxPercent: v.taxPercent, dueDays: v.dueDays, sendEmail: v.sendEmail, simulated: false }, v.secret || undefined);
    return { ok: `Conexiune reușită.${result.series.length ? ` Serii găsite: ${result.series.join(", ")}.` : ""}` };
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
    p_provider: v.provider, p_account_email: v.accountEmail, p_vat_code: v.vatCode, p_series: v.series, p_tax: v.taxPercent, p_due_days: v.dueDays, p_send_email: v.sendEmail, ...(v.secret ? { p_secret: v.secret } : {}),
  });
  if (error) return { error: error.code === "22023" ? "Introdu tokenul sau cheia API a furnizorului." : "Conexiunea nu a putut fi salvată. Încearcă din nou." };
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
