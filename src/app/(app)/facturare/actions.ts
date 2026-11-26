"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBackOfficeContext } from "@/lib/auth";
import { todayInOrgTimeZone } from "@/lib/date";
import {
  InvoicingError, PROVIDER_LABEL, cancelDocument, collectPayment, emailDocument, issueDocument, loadConnection, paymentState, reverseInvoice, searchProducts, sendEinvoice,
  type DocRef, type DocType, type Line, type PayMethod, type Product,
} from "@/lib/invoicing";
import { anafLookup, normalizeCui, type AnafCompany } from "@/lib/invoicing/anaf";
import { totals } from "@/lib/invoicing/calc";

export type ActionState = { error?: string; ok?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const METHODS: PayMethod[] = ["numerar", "card", "ordin_plata", "alta"];
const msg = (e: unknown, fallback: string) => (e instanceof InvoicingError ? e.message : fallback);
const r2 = (n: number) => Math.round(n * 100) / 100;

async function office() {
  const ctx = await requireBackOfficeContext();
  if (!ctx) throw new InvoicingError("Doar administratorul sau managerul se ocupă de facturare.");
  return ctx;
}

type Payload = {
  docType: DocType;
  clientId: string;
  client: { name: string; type: "firma" | "persoana"; cui: string; regCom: string; address: string; city: string; county: string; email: string; phone: string; vatPayer: boolean };
  jobId: string | null;
  fromProformaId: string | null;
  series: string;
  issueDate: string;
  dueDate: string;
  mentions: string;
  sendEmail: boolean;
  collect: { method: PayMethod; amount: number; document: string } | null;
  lines: { name: string; unit: string; quantity: number; price: number; vatPercent: number; isService: boolean; code: string | null }[];
};

function parsePayload(raw: string): Payload | string {
  let p: Payload;
  try { p = JSON.parse(raw) as Payload; } catch { return "Datele formularului nu au putut fi citite."; }
  if (p.docType !== "factura" && p.docType !== "proforma") return "Alege tipul documentului.";
  if (!UUID.test(p.clientId ?? "")) return "Alege clientul.";
  if (!p.client?.name?.trim()) return "Completează numele clientului.";
  if (p.client.type === "firma" && !/^\d{2,10}$/.test(normalizeCui(p.client.cui ?? ""))) return "Pentru o firmă, completează CUI-ul (ex. RO12345678).";
  if (!p.client.address?.trim() || !p.client.city?.trim()) return "Completează adresa și localitatea clientului (sunt obligatorii pe factură și în e-Factura).";
  if (!DATE.test(p.issueDate) || !DATE.test(p.dueDate) || p.dueDate < p.issueDate) return "Verifică data emiterii și scadența.";
  if (!p.series?.trim()) return "Alege seria.";
  if (!Array.isArray(p.lines) || p.lines.length === 0 || p.lines.length > 100) return "Adaugă cel puțin un rând (cel mult 100).";
  for (const l of p.lines) {
    if (!l.name?.trim() || l.name.length > 300) return "Fiecare rând are nevoie de o denumire.";
    if (!Number.isFinite(l.quantity) || l.quantity <= 0 || !Number.isFinite(l.price) || l.price < 0) return `Rândul „${l.name}”: cantitatea trebuie să fie peste 0, iar prețul cel puțin 0.`;
    if (!Number.isFinite(l.vatPercent) || l.vatPercent < 0 || l.vatPercent > 100) return `Rândul „${l.name}”: cota TVA nu e validă.`;
  }
  if (p.jobId && !UUID.test(p.jobId)) return "Lucrarea nu e validă.";
  if (p.fromProformaId && !UUID.test(p.fromProformaId)) return "Proforma nu e validă.";
  if (p.collect && (!METHODS.includes(p.collect.method) || !(p.collect.amount > 0))) return "Încasarea: alege modul și o sumă mai mare ca zero.";
  if (p.sendEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.client.email ?? "")) return "Pentru trimitere pe e-mail, completează adresa clientului.";
  return p;
}

/** Emite factura sau proforma: întâi la furnizor (numărul fiscal vine de acolo), apoi copia în platformă. */
export async function issueAction(_prev: ActionState | undefined, fd: FormData): Promise<ActionState> {
  let createdId: string | null = null;
  try {
    const ctx = await office();
    const p = parsePayload(String(fd.get("payload") ?? ""));
    if (typeof p === "string") return { error: p };
    const supabase = await createClient();
    const orgId = ctx.organization.id;

    const { data: client } = await supabase.from("clients").select("id").eq("id", p.clientId).eq("organization_id", orgId).maybeSingle();
    if (!client) return { error: "Clientul nu a fost găsit." };
    if (p.jobId) {
      const { data: job } = await supabase.from("jobs").select("id").eq("id", p.jobId).eq("organization_id", orgId).maybeSingle();
      if (!job) return { error: "Lucrarea nu a fost găsită." };
      if (p.docType === "factura") {
        const { data: existing } = await supabase.from("invoices").select("invoice_number").eq("job_id", p.jobId).eq("doc_type", "factura").neq("status", "cancelled").limit(1);
        if (existing?.length) return { error: `Lucrarea are deja factura ${existing[0].invoice_number}. Anuleaz-o sau storneaz-o înainte să emiți alta.` };
      }
    }
    let proforma: { id: string; provider_series: string | null; provider_number: string | null; status: string } | null = null;
    if (p.fromProformaId) {
      const { data } = await supabase.from("invoices").select("id, provider_series, provider_number, status").eq("id", p.fromProformaId).eq("organization_id", orgId).eq("doc_type", "proforma").maybeSingle();
      if (!data || data.status === "cancelled") return { error: "Proforma nu există sau e anulată." };
      const { data: done } = await supabase.from("invoices").select("invoice_number").eq("reference_invoice_id", data.id).eq("doc_type", "factura").neq("status", "cancelled").limit(1);
      if (done?.length) return { error: `Proforma a fost deja facturată (${done[0].invoice_number}).` };
      proforma = data;
    }

    // Datele clientului se salvează și pe fișa lui, ca data viitoare să fie deja completate.
    const cui = p.client.type === "firma" ? p.client.cui.trim().toUpperCase().replace(/\s+/g, "") : "";
    const address = [p.client.address.trim(), p.client.city.trim(), p.client.county.trim()].filter(Boolean).join(", ");
    await supabase.from("clients").update({
      name: p.client.name.trim(), cui: cui || null, address, email: p.client.email.trim() || null, phone: p.client.phone.trim() || null,
      client_type: p.client.type === "firma" ? "company" : "individual",
      ...(p.client.type === "firma" ? { company_name: p.client.name.trim() } : {}),
    }).eq("id", p.clientId).eq("organization_id", orgId);

    const connection = await loadConnection(supabase, orgId);
    const lines: Line[] = p.lines.map((l) => ({ name: l.name.trim(), unit: (l.unit || "buc").trim().slice(0, 20), quantity: l.quantity, price: l.price, vatPercent: l.vatPercent, isService: l.isService, code: l.code || null }));
    const sum = totals(lines);
    const collect = p.docType === "factura" && p.collect ? { method: p.collect.method, amount: r2(Math.min(p.collect.amount, sum.gross)), date: p.issueDate, document: p.collect.document?.trim() || null } : null;
    const clientData = {
      name: p.client.name.trim(), vatCode: cui || null, isTaxPayer: p.client.type === "firma" && (p.client.vatPayer || /^RO/i.test(cui)),
      regCom: p.client.regCom.trim() || null, address: p.client.address.trim(), city: p.client.city.trim(), county: p.client.county.trim() || null,
      email: p.client.email.trim() || null, phone: p.client.phone.trim() || null,
    };

    let issued;
    try {
      issued = await issueDocument(supabase, connection, {
        docType: p.docType, series: p.series.trim(), client: clientData, lines, issueDate: p.issueDate, dueDate: p.dueDate,
        mentions: p.mentions.trim().slice(0, 500) || null, sendEmail: p.sendEmail, collect,
        fromProforma: proforma?.provider_series && proforma.provider_number ? { series: proforma.provider_series, number: proforma.provider_number } : null,
      }, orgId);
    } catch (e) {
      return { error: msg(e, "Furnizorul de facturare nu a putut emite documentul. Încearcă din nou.") };
    }

    const label = !connection ? `${p.docType === "proforma" ? "PF" : "FACT"}-${issued.number}` : `${issued.series} ${issued.number}`;
    const { data: row, error } = await supabase.from("invoices").insert({
      organization_id: orgId, client_id: p.clientId, job_id: p.jobId, doc_type: p.docType, invoice_number: label,
      labor_amount: sum.services, materials_amount: sum.goods, travel_amount: 0, other_amount: 0, vat_amount: sum.vat,
      issued_at: p.issueDate, due_date: p.dueDate, created_by: ctx.userId, mentions: p.mentions.trim() || null,
      client_snapshot: clientData, reference_invoice_id: proforma?.id ?? null,
      provider_url: issued.url, emailed_at: p.sendEmail ? new Date().toISOString() : null,
      ...(connection ? { provider: connection.provider, provider_series: issued.series, provider_number: issued.number, simulated: connection.simulated } : {}),
    }).select("id").single();
    if (error || !row) {
      return { error: connection && !connection.simulated
        ? `Documentul ${label} a fost emis în ${PROVIDER_LABEL[connection.provider]}, dar nu s-a salvat aici. Nu-l emite din nou: notează numărul și spune-ne.`
        : "Documentul nu a putut fi salvat. Încearcă din nou." };
    }
    createdId = row.id;
    await supabase.from("invoice_lines").insert(lines.map((l, i) => ({
      invoice_id: row.id, organization_id: orgId, position: i + 1, name: l.name, unit: l.unit, quantity: l.quantity, unit_price: l.price, vat_percent: l.vatPercent, is_service: l.isService, code: l.code ?? null,
    })));
    if (collect) {
      await supabase.from("invoice_payments").insert({ organization_id: orgId, invoice_id: row.id, amount: collect.amount, method: collect.method, paid_on: collect.date, document: collect.document });
    }
    if (p.jobId && p.docType === "factura") {
      await supabase.from("billing_requests").update({ status: "invoiced", handled_by: ctx.userId, handled_at: new Date().toISOString() })
        .eq("organization_id", orgId).eq("job_id", p.jobId).eq("status", "new");
    }
    revalidatePath("/facturare");
    revalidatePath("/dashboard");
  } catch (e) {
    return { error: msg(e, "Documentul nu a putut fi emis. Încearcă din nou.") };
  }
  redirect(`/facturare/${createdId}?emis=1`);
}

async function loadDoc(id: string) {
  const ctx = await office();
  if (!UUID.test(id)) throw new InvoicingError("Documentul nu e valid.");
  const supabase = await createClient();
  const { data: inv } = await supabase.from("invoices")
    .select("id, doc_type, status, provider, provider_series, provider_number, simulated, gross_amount, paid_amount, invoice_number, client_snapshot, reference_invoice_id, job_id, client_id, labor_amount, materials_amount, vat_amount, provider_url, clients(email)")
    .eq("id", id).eq("organization_id", ctx.organization.id).maybeSingle();
  if (!inv) throw new InvoicingError("Documentul nu a fost găsit.");
  const connection = await loadConnection(supabase, ctx.organization.id);
  if (inv.provider && connection && inv.provider !== connection.provider) throw new InvoicingError(`Documentul a fost emis în ${PROVIDER_LABEL[inv.provider as "smartbill" | "oblio"]}, dar firma e conectată acum la ${PROVIDER_LABEL[connection.provider]}. Gestionează-l direct în contul vechi.`);
  const ref: DocRef | null = inv.provider_series && inv.provider_number ? { docType: inv.doc_type === "proforma" ? "proforma" : "factura", series: inv.provider_series, number: inv.provider_number } : null;
  return { ctx, supabase, inv, connection: inv.provider ? connection : null, ref };
}

const done = (id: string) => { revalidatePath(`/facturare/${id}`); revalidatePath("/facturare"); revalidatePath("/dashboard"); };

export async function recordPayment(_prev: ActionState | undefined, fd: FormData): Promise<ActionState> {
  try {
    const { ctx, supabase, inv, connection, ref } = await loadDoc(String(fd.get("id") ?? ""));
    if (inv.doc_type !== "factura") return { error: "Doar o factură se încasează (proforma nu)." };
    if (inv.status === "cancelled") return { error: "Factura e anulată." };
    const amount = r2(Number(String(fd.get("amount") ?? "").replace(",", ".")));
    const method = String(fd.get("method") ?? "") as PayMethod;
    const date = String(fd.get("date") ?? "");
    const document = String(fd.get("document") ?? "").trim().slice(0, 60) || null;
    const rest = r2(Number(inv.gross_amount) - Number(inv.paid_amount));
    if (!METHODS.includes(method)) return { error: "Alege modul de încasare." };
    if (!DATE.test(date) || date > todayInOrgTimeZone()) return { error: "Data încasării nu poate fi în viitor." };
    if (!(amount > 0)) return { error: "Suma trebuie să fie mai mare ca zero." };
    if (amount > rest + 0.01) return { error: `Suma depășește restul de plată (${rest.toFixed(2)} lei).` };
    let providerDoc: string | null = null;
    if (connection && ref) {
      try { providerDoc = (await collectPayment(supabase, connection, ref, { method, amount, date, document })).document; }
      catch (e) { return { error: msg(e, "Furnizorul nu a înregistrat încasarea.") }; }
    }
    const { error } = await supabase.from("invoice_payments").insert({ organization_id: ctx.organization.id, invoice_id: inv.id, amount, method, paid_on: date, document: providerDoc ?? document });
    if (error) return { error: connection && !connection.simulated ? "Încasarea s-a înregistrat la furnizor, dar nu și aici. Apasă „Sincronizează”." : "Încasarea nu s-a salvat." };
    done(inv.id);
    return { ok: `Încasare de ${amount.toFixed(2)} lei înregistrată${providerDoc ? ` (${providerDoc})` : ""}.` };
  } catch (e) { return { error: msg(e, "Încasarea nu s-a salvat.") }; }
}

export async function deletePayment(fd: FormData): Promise<void> {
  const { ctx, supabase, inv, connection } = await loadDoc(String(fd.get("id") ?? ""));
  const paymentId = String(fd.get("paymentId") ?? "");
  // La un furnizor real, încasarea se șterge din contul lui; aici ar rămâne nepotrivită.
  if (connection && !connection.simulated) return;
  if (!UUID.test(paymentId)) return;
  await supabase.from("invoice_payments").delete().eq("id", paymentId).eq("invoice_id", inv.id).eq("organization_id", ctx.organization.id);
  done(inv.id);
}

export async function cancelAction(_prev: ActionState | undefined, fd: FormData): Promise<ActionState> {
  try {
    const { supabase, inv, connection, ref } = await loadDoc(String(fd.get("id") ?? ""));
    const restore = fd.get("restore") === "1";
    if (!restore && inv.status === "cancelled") return { error: "Documentul e deja anulat." };
    if (!restore && Number(inv.paid_amount) > 0) return { error: "Factura are încasări. Pentru o factură încasată, emite o stornare." };
    if (connection && ref) {
      try { await cancelDocument(supabase, connection, ref, restore); }
      catch (e) { return { error: msg(e, "Furnizorul nu a putut anula documentul.") }; }
    }
    const status = restore ? (Number(inv.paid_amount) >= Number(inv.gross_amount) - 0.01 && Number(inv.gross_amount) > 0 ? "paid" : "unpaid") : "cancelled";
    await supabase.from("invoices").update({ status, cancelled_at: restore ? null : new Date().toISOString() }).eq("id", inv.id);
    done(inv.id);
    return { ok: restore ? "Documentul a fost restaurat." : "Documentul a fost anulat." };
  } catch (e) { return { error: msg(e, "Anularea nu a reușit.") }; }
}

/** Stornare totală: un document nou, cu aceleași rânduri în minus. Originalul nu mai e de încasat. */
export async function reverseAction(_prev: ActionState | undefined, fd: FormData): Promise<ActionState> {
  let createdId: string | null = null;
  try {
    const { ctx, supabase, inv, connection, ref } = await loadDoc(String(fd.get("id") ?? ""));
    if (inv.doc_type !== "factura" || inv.status === "cancelled") return { error: "Se stornează doar o factură emisă, neanulată." };
    const { data: prev } = await supabase.from("invoices").select("invoice_number").eq("reference_invoice_id", inv.id).eq("doc_type", "storno").limit(1);
    if (prev?.length) return { error: `Factura are deja stornarea ${prev[0].invoice_number}.` };
    const today = todayInOrgTimeZone();
    let issued;
    try { issued = await reverseInvoice(supabase, connection, ref ?? { docType: "factura", series: "", number: "" }, today, ctx.organization.id); }
    catch (e) { return { error: msg(e, "Furnizorul nu a putut emite stornarea.") }; }
    const label = connection ? `${issued.series} ${issued.number}` : `FACT-${issued.number}`;
    const { data: lines } = await supabase.from("invoice_lines").select("name, unit, quantity, unit_price, vat_percent, is_service, code, position").eq("invoice_id", inv.id).order("position");
    const { data: row, error } = await supabase.from("invoices").insert({
      organization_id: ctx.organization.id, client_id: inv.client_id, job_id: inv.job_id, doc_type: "storno", invoice_number: label,
      labor_amount: -Number(inv.labor_amount), materials_amount: -Number(inv.materials_amount), travel_amount: 0, other_amount: 0, vat_amount: -Number(inv.vat_amount),
      issued_at: today, due_date: today, created_by: ctx.userId, status: "paid", reference_invoice_id: inv.id, client_snapshot: inv.client_snapshot,
      mentions: `Stornare integrală a facturii ${inv.invoice_number}`, provider_url: issued.url,
      ...(connection ? { provider: connection.provider, provider_series: issued.series, provider_number: issued.number, simulated: connection.simulated } : {}),
    }).select("id").single();
    if (error || !row) return { error: connection && !connection.simulated ? `Stornarea ${label} a fost emisă la furnizor, dar nu s-a salvat aici. Notează numărul și spune-ne.` : "Stornarea nu s-a salvat." };
    createdId = row.id;
    if (lines?.length) {
      await supabase.from("invoice_lines").insert(lines.map((l) => ({ invoice_id: row.id, organization_id: ctx.organization.id, position: l.position, name: l.name, unit: l.unit, quantity: -Number(l.quantity), unit_price: Number(l.unit_price), vat_percent: Number(l.vat_percent), is_service: l.is_service, code: l.code })));
    }
    await supabase.from("invoices").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", inv.id);
    done(inv.id);
  } catch (e) { return { error: msg(e, "Stornarea nu a reușit.") }; }
  redirect(`/facturare/${createdId}?emis=1`);
}

export async function emailAction(_prev: ActionState | undefined, fd: FormData): Promise<ActionState> {
  try {
    const { supabase, inv, connection, ref } = await loadDoc(String(fd.get("id") ?? ""));
    const to = String(fd.get("to") ?? "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return { error: "Introdu o adresă de e-mail validă." };
    if (!ref) return { error: "Documentul nu are număr de la furnizor." };
    try { await emailDocument(supabase, connection, ref, to); }
    catch (e) { return { error: msg(e, "Trimiterea nu a reușit.") }; }
    await supabase.from("invoices").update({ emailed_at: new Date().toISOString() }).eq("id", inv.id);
    done(inv.id);
    return { ok: connection?.simulated ? `Simulat: în demo nu se trimite niciun e-mail (ar fi mers la ${to}).` : `Trimis la ${to}.` };
  } catch (e) { return { error: msg(e, "Trimiterea nu a reușit.") }; }
}

export async function einvoiceAction(_prev: ActionState | undefined, fd: FormData): Promise<ActionState> {
  try {
    const { supabase, inv, connection, ref } = await loadDoc(String(fd.get("id") ?? ""));
    if (!ref || inv.doc_type === "proforma") return { error: "În SPV se trimit doar facturi." };
    let status: string;
    try { status = await sendEinvoice(supabase, connection, ref); }
    catch (e) { return { error: msg(e, "Trimiterea în SPV nu a reușit.") }; }
    await supabase.from("invoices").update({ e_invoice_status: status }).eq("id", inv.id);
    done(inv.id);
    return { ok: `e-Factura: ${status}.` };
  } catch (e) { return { error: msg(e, "Trimiterea în SPV nu a reușit.") }; }
}

/**
 * Aduce de la furnizor încasările (și starea e-Factura / anulările) pentru facturile deschise.
 * Diferența dintre ce știe furnizorul și ce e aici se trece ca o încasare „din furnizor”.
 */
export async function syncAction(prev: ActionState | undefined): Promise<ActionState> {
  void prev;
  try {
    const ctx = await office();
    const supabase = await createClient();
    const connection = await loadConnection(supabase, ctx.organization.id);
    if (!connection || connection.simulated) return { ok: "Nimic de sincronizat: în demo sau fără furnizor, încasările se trec aici." };
    const { data: open } = await supabase.from("invoices").select("id, provider_series, provider_number, paid_amount, gross_amount, status")
      .eq("organization_id", ctx.organization.id).eq("provider", connection.provider).eq("doc_type", "factura").in("status", ["unpaid", "overdue"])
      .order("issued_at", { ascending: true }).limit(25);
    let changed = 0, checked = 0;
    const today = todayInOrgTimeZone();
    for (const inv of open ?? []) {
      if (!inv.provider_series || !inv.provider_number) continue;
      let state;
      try { state = await paymentState(supabase, connection, inv.provider_series, inv.provider_number); }
      catch (e) { return { error: `${msg(e, "Furnizorul nu a răspuns.")} Am verificat ${checked} facturi.` }; }
      checked++;
      if (state.cancelled) {
        await supabase.from("invoices").update({ status: "cancelled", cancelled_at: new Date().toISOString(), provider_synced_at: new Date().toISOString() }).eq("id", inv.id);
        changed++; continue;
      }
      const remote = state.paidAmount ?? (state.paid ? Number(inv.gross_amount) : null);
      const diff = remote === null ? 0 : r2(remote - Number(inv.paid_amount));
      if (Math.abs(diff) >= 0.01) {
        await supabase.from("invoice_payments").insert({ organization_id: ctx.organization.id, invoice_id: inv.id, amount: diff, method: "alta", paid_on: today, document: `din ${PROVIDER_LABEL[connection.provider]}`, source: "furnizor" });
        changed++;
      }
      await supabase.from("invoices").update({ provider_synced_at: new Date().toISOString(), ...(state.eInvoice ? { e_invoice_status: state.eInvoice } : {}) }).eq("id", inv.id);
    }
    revalidatePath("/facturare");
    revalidatePath("/dashboard");
    return { ok: checked ? `Am verificat ${checked} facturi la ${PROVIDER_LABEL[connection.provider]}; ${changed} s-au schimbat.` : "Nicio factură deschisă de verificat." };
  } catch (e) { return { error: msg(e, "Sincronizarea nu a reușit.") }; }
}

export async function resolveBillingRequest(fd: FormData) {
  const requestId = String(fd.get("requestId") ?? "");
  if (!UUID.test(requestId)) return;
  const ctx = await requireBackOfficeContext();
  if (!ctx) return;
  const supabase = await createClient();
  await supabase.from("billing_requests").update({ status: "dismissed", handled_by: ctx.userId, handled_at: new Date().toISOString() })
    .eq("id", requestId).eq("organization_id", ctx.organization.id).eq("status", "new");
  revalidatePath("/facturare");
}

/** Datele firmei de la ANAF, după CUI (formularul le completează singur). */
export async function lookupCompany(cui: string): Promise<{ company?: AnafCompany; error?: string }> {
  try {
    await office();
    const c = await anafLookup(cui, todayInOrgTimeZone());
    if (!c) return { error: "ANAF nu are o firmă cu acest CUI." };
    return { company: c };
  } catch (e) {
    return { error: e instanceof InvoicingError ? e.message : "ANAF nu a răspuns. Completează datele de mână sau încearcă din nou." };
  }
}

export async function findProducts(q: string): Promise<Product[]> {
  try {
    const ctx = await office();
    const supabase = await createClient();
    const connection = await loadConnection(supabase, ctx.organization.id);
    return await searchProducts(supabase, connection, ctx.organization.id, q, Number(ctx.organization.invoice_material_markup ?? 0));
  } catch { return []; }
}

/** Tarifele folosite la precompletarea facturii dintr-o lucrare. */
export async function saveBillingRates(_prev: ActionState | undefined, fd: FormData): Promise<ActionState> {
  const ctx = await requireBackOfficeContext();
  if (!ctx || ctx.profile.role !== "admin") return { error: "Doar administratorul schimbă tarifele." };
  const rate = String(fd.get("laborRate") ?? "").replace(",", ".").trim();
  const markup = Number(String(fd.get("markup") ?? "0").replace(",", "."));
  if (rate && !(Number(rate) >= 0)) return { error: "Tariful orar nu e valid." };
  if (!(markup >= 0 && markup <= 500)) return { error: "Adaosul trebuie să fie între 0 și 500%." };
  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update({ invoice_labor_rate: rate ? r2(Number(rate)) : null, invoice_material_markup: r2(markup) }).eq("id", ctx.organization.id);
  if (error) return { error: "Tarifele nu s-au salvat." };
  revalidatePath("/facturare");
  revalidatePath("/setari");
  return { ok: "Tarife salvate." };
}
