"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { billingDb, BillingError, workflow } from "@/lib/billing/store";
import { oblioRead, issueOblio, OblioError } from "@/lib/billing/oblio";
import { decimal, scaled } from "@/lib/billing/money";
import type { BillingState } from "./actions";
import { providerToken } from "@/lib/billing/provider";
const value = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
function message(e: unknown) {
  return e instanceof BillingError || e instanceof OblioError
    ? e.message
    : "Operația nu a putut fi finalizată. Reîncearcă.";
}
async function issue(id: string, sendEmail: boolean) {
  const token = await providerToken();
  const db = await billingDb();
  const { data: c, error } = await db
    .from("billing_company_settings")
    .select("cui")
    .eq("id", 1)
    .single();
  if (error || !c)
    throw new BillingError("Completează datele firmei în Setări.");
  const rates = await oblioRead<{ name: string; percent: string | number }[]>(
    `/nomenclature/vat_rates?cif=${encodeURIComponent(c.cui)}`,
    token,
  );
  if (!Array.isArray(rates))
    throw new OblioError("Cotele TVA nu au putut fi citite din Oblio.");
  const vatNames = Object.fromEntries(
    rates.map((r) => [decimal(scaled(String(r.percent), 2)), r.name]),
  );
  const prepared = await workflow<{
    issued?: boolean;
    payload: Record<string, unknown>;
    kind: string;
  }>("prepare", { id, sendEmail, vatNames });
  if (prepared.issued) return;
  try {
    const result = await issueOblio(token, prepared.kind, prepared.payload);
    await workflow("confirm", { id, ...result });
  } catch (e) {
    await workflow(
      e instanceof OblioError && e.rejected ? "reject" : "uncertain",
      { id },
    );
    throw e;
  }
}
export async function saveInvoice(
  _: BillingState,
  f: FormData,
): Promise<BillingState> {
  await billingDb();
  let id = "";
  try {
    const raw = value(f, "lines");
    if (raw.length > 100000)
      throw new BillingError("Factura are prea multe linii.");
    const result = await workflow<{ id: string }>("save_draft", {
      id: value(f, "id"),
      clientId: value(f, "clientId"),
      seriesId: value(f, "seriesId"),
      kind: value(f, "kind"),
      date: value(f, "date"),
      due: value(f, "due"),
      notes: value(f, "notes"),
      lines: JSON.parse(raw),
    });
    id = result.id;
    if (value(f, "intent") === "issue")
      await issue(id, f.get("sendEmail") === "on");
  } catch (e) {
    revalidatePath("/admin/facturare", "layout");
    return { error: message(e), ...(id ? { invoiceId: id } : {}) };
  }
  revalidatePath("/admin/facturare", "layout");
  redirect(`/admin/facturare/facturi/${id}`);
}
export async function retryIssue(
  _: BillingState,
  f: FormData,
): Promise<BillingState> {
  await billingDb();
  const id = value(f, "id");
  try {
    await issue(id, f.get("sendEmail") === "on");
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath("/admin/facturare", "layout");
  return { success: "Factura a fost confirmată de Oblio." };
}
export async function createCredit(
  _: BillingState,
  f: FormData,
): Promise<BillingState> {
  await billingDb();
  let id;
  try {
    id = (await workflow<{ id: string }>("credit", { id: value(f, "id") })).id;
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath("/admin/facturare", "layout");
  redirect(`/admin/facturare/facturi/${id}`);
}
export async function recordPayment(
  _: BillingState,
  f: FormData,
): Promise<BillingState> {
  await billingDb();
  try {
    await workflow("payment", {
      id: value(f, "id"),
      paymentId: value(f, "paymentId"),
      amount: value(f, "amount").replace(",", "."),
      date: value(f, "date"),
      method: value(f, "method"),
      notes: value(f, "notes"),
    });
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath("/admin/facturare", "layout");
  return { success: "Încasarea a fost înregistrată." };
}
export async function quickClient(
  _: BillingState,
  f: FormData,
): Promise<BillingState> {
  const db = await billingDb();
  const cui = value(f, "cui").replace(/\s/g, "").toUpperCase();
  if (!/^(RO)?\d{2,10}$/.test(cui))
    return { error: "Introdu un CUI valid (opțional cu prefixul RO)." };
  const existing = await db
    .from("billing_clients")
    .select("id")
    .eq("cui", cui)
    .maybeSingle();
  if (existing.data)
    return { success: "Clientul există deja.", clientId: existing.data.id };
  let imported: Record<string, unknown> = {};
  const { data: connection } = await db
    .from("billing_oblio_connections")
    .select("enabled")
    .eq("company_id", 1)
    .maybeSingle();
  if (connection?.enabled) {
    try {
      const token = await providerToken();
      const { data: c } = await db
        .from("billing_company_settings")
        .select("cui")
        .eq("id", 1)
        .single();
      const clients = await oblioRead<
        {
          cif?: string;
          name?: string;
          address?: string;
          city?: string;
          state?: string;
          email?: string;
          phone?: string;
          rc?: string;
          vatPayer?: number;
        }[]
      >(
        `/nomenclature/clients?cif=${encodeURIComponent(c?.cui ?? "")}&clientCif=${encodeURIComponent(cui)}`,
        token,
      );
      const match = Array.isArray(clients)
        ? clients.find(
            (c) => c.cif?.replace(/^RO/i, "") === cui.replace(/^RO/, ""),
          )
        : null;
      if (match?.name)
        imported = {
          name: match.name,
          address: match.address || null,
          city: match.city || null,
          county: match.state || null,
          email: match.email || null,
          phone: match.phone || null,
          registration_number: match.rc || null,
          vat_payer: !!match.vatPayer,
        };
    } catch (e) {
      return { error: message(e) };
    }
  }
  const { data, error } = await db
    .from("billing_clients")
    .insert({ cui, ...imported })
    .select("id")
    .single();
  if (error)
    return {
      error: "Clientul nu a putut fi adăugat. Verifică dacă există deja.",
    };
  revalidatePath("/admin/facturare", "layout");
  return {
    success: imported.name
      ? "Clientul a fost preluat din Oblio."
      : "CUI salvat. Completează denumirea și adresa înainte de emitere.",
    clientId: data.id,
  };
}
export async function searchClients(q: string) {
  const db = await billingDb();
  const { data, error } = await db.rpc("billing_client_balances", {
    p_search: q.slice(0, 100),
    p_offset: 0,
  });
  if (error) throw new BillingError("Clienții nu au putut fi căutați.");
  return (data ?? []).map((c) => ({ id: c.id, name: c.name, cui: c.cui }));
}

export async function correctRejected(
  _: BillingState,
  f: FormData,
): Promise<BillingState> {
  await billingDb();
  const id = value(f, "id");
  try {
    await workflow("correct_rejected", { id });
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath("/admin/facturare", "layout");
  redirect(`/admin/facturare/facturi/noua?draft=${id}`);
}
