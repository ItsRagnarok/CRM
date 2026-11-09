"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext, requireBackOfficeContext } from "@/lib/auth";
import { todayInOrgTimeZone } from "@/lib/date";
import { InvoicingError, PROVIDER_LABEL, issueInvoice, loadConnection, paymentState } from "@/lib/invoicing";

export type InvoiceState = { error?: string; ok?: string };

const money = (n: number) => Math.round(n * 100) / 100;
const cityOf = (address: string | null) => {
  const parts = (address ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : null;
};

export async function createInvoiceForJob(_prev: InvoiceState | undefined, formData: FormData): Promise<InvoiceState> {
  const jobId = String(formData.get("jobId") ?? "");
  const laborAmount = money(Number(formData.get("laborAmount") ?? 0) || 0);
  const materialsAmount = money(Number(formData.get("materialsAmount") ?? 0) || 0);
  const travelAmount = money(Number(formData.get("travelAmount") ?? 0) || 0);
  const otherAmount = money(Number(formData.get("otherAmount") ?? 0) || 0);
  const total = laborAmount + materialsAmount + travelAmount + otherAmount;
  if (!jobId) return { error: "Alege o lucrare." };
  if (total <= 0) return { error: "Completează cel puțin o sumă mai mare ca zero." };

  const { organization, userId, profile, readOnly } = await requireSessionContext();
  if (readOnly || !["admin", "manager"].includes(profile.role)) return { error: "Doar administratorul sau managerul poate emite facturi." };
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("client_id, display_number, clients(name, cui, address, email)")
    .eq("id", jobId)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!job) return { error: "Lucrarea nu a fost găsită." };

  const connection = await loadConnection(supabase, organization.id);
  let provider: { series: string; number: string } | null = null;
  let dueDate: string | null = null;
  if (connection) {
    const { data: existing } = await supabase.from("invoices").select("invoice_number").eq("job_id", jobId).not("provider", "is", null).limit(1);
    if (existing?.length) return { error: `Lucrarea are deja factura ${existing[0].invoice_number}. Nu emit a doua factură pentru aceeași lucrare.` };
    const today = todayInOrgTimeZone();
    const due = new Date(Date.parse(`${today}T00:00:00Z`) + connection.dueDays * 86_400_000).toISOString().slice(0, 10);
    dueDate = due;
    const client = job.clients;
    const lines = [
      { name: `Manoperă · lucrare #${job.display_number}`, amount: laborAmount, service: true },
      { name: `Materiale · lucrare #${job.display_number}`, amount: materialsAmount, service: false },
      { name: `Deplasare · lucrare #${job.display_number}`, amount: travelAmount, service: true },
      { name: `Alte costuri · lucrare #${job.display_number}`, amount: otherAmount, service: true },
    ].filter((l) => l.amount > 0).map((l) => ({ name: l.name, unit: "buc", quantity: 1, price: l.amount, isService: l.service }));
    try {
      const issued = await issueInvoice(supabase, connection, {
        client: { name: client?.name ?? "Client", vatCode: client?.cui ?? null, isTaxPayer: /^RO/i.test(client?.cui ?? ""), address: client?.address ?? null, city: cityOf(client?.address ?? null), email: client?.email ?? null },
        lines, issueDate: today, dueDate: due,
      }, organization.id);
      provider = { series: issued.series, number: issued.number };
    } catch (e) {
      return { error: e instanceof InvoicingError ? e.message : "Furnizorul de facturare nu a putut emite factura. Încearcă din nou." };
    }
  }

  let invoiceNumber: string;
  if (provider) {
    invoiceNumber = `${provider.series} ${provider.number}`;
  } else {
    // next_invoice_number() increments a per-org counter atomically, so concurrent calls get distinct numbers.
    const { data: nextNumber, error: numberError } = await supabase.rpc("next_invoice_number", { p_organization_id: organization.id });
    if (numberError || !nextNumber) return { error: "Nu am putut genera numărul facturii. Încearcă din nou." };
    invoiceNumber = `FACT-${String(nextNumber).padStart(4, "0")}`;
  }

  // total_amount is a DB-generated column (sum of the four below), so it is never sent.
  const { error } = await supabase.from("invoices").insert({
    organization_id: organization.id,
    client_id: job.client_id,
    job_id: jobId,
    invoice_number: invoiceNumber,
    labor_amount: laborAmount,
    materials_amount: materialsAmount,
    travel_amount: travelAmount,
    other_amount: otherAmount,
    created_by: userId,
    ...(dueDate ? { due_date: dueDate } : {}),
    ...(connection && provider ? { provider: connection.provider, provider_series: provider.series, provider_number: provider.number, simulated: connection.simulated } : {}),
  });
  if (error) {
    return { error: provider ? `Factura ${invoiceNumber} a fost emisă la ${PROVIDER_LABEL[connection!.provider]}, dar nu s-a salvat aici. Nu o emite din nou: notează numărul și spune-ne.` : "Factura nu a putut fi salvată." };
  }

  revalidatePath("/facturare");
  return { ok: provider ? `Factura ${invoiceNumber} a fost emisă${connection?.simulated ? " (simulat, demo)" : ` în ${PROVIDER_LABEL[connection!.provider]}`}.` : `Factura ${invoiceNumber} a fost salvată.` };
}

/** Pulls payment status from the provider for every unpaid provider invoice; the office no longer ticks them by hand. */
export async function syncInvoicePayments(): Promise<void> {
  const { organization, readOnly, profile } = await requireSessionContext();
  if (readOnly || !["admin", "manager"].includes(profile.role)) return;
  const supabase = await createClient();
  const connection = await loadConnection(supabase, organization.id);
  if (!connection || connection.simulated) return;
  const { data: open } = await supabase.from("invoices").select("id, provider_series, provider_number")
    .eq("organization_id", organization.id).eq("provider", connection.provider).in("status", ["unpaid", "overdue"]).limit(25);
  for (const inv of open ?? []) {
    if (!inv.provider_series || !inv.provider_number) continue;
    try {
      const state = await paymentState(supabase, connection, inv.provider_series, inv.provider_number);
      await supabase.from("invoices").update({ ...(state.paid ? { status: "paid" } : {}), provider_synced_at: new Date().toISOString(), e_invoice_status: state.eInvoice }).eq("id", inv.id);
    } catch {
      break; // rate limit or credentials problem: stop instead of hammering the provider
    }
  }
  revalidatePath("/facturare");
}

export async function resolveBillingRequest(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");
  const outcome = String(formData.get("outcome") ?? "") === "dismissed" ? "dismissed" : "invoiced";
  if (!requestId) return;
  const ctx = await requireBackOfficeContext();
  if (!ctx) return;
  const supabase = await createClient();
  await supabase
    .from("billing_requests")
    .update({ status: outcome, handled_by: ctx.userId, handled_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("organization_id", ctx.organization.id)
    .eq("status", "new");
  revalidatePath("/facturare");
}

export async function markInvoicePaid(formData: FormData) {
  const invoiceId = String(formData.get("invoiceId") ?? "");
  if (!invoiceId) return;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();
  await supabase
    .from("invoices")
    .update({ status: "paid" })
    .eq("id", invoiceId)
    .eq("organization_id", organization.id);
  revalidatePath("/facturare");
}
