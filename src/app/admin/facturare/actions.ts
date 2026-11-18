"use server";

import { revalidatePath } from "next/cache";
import { billingDb } from "@/lib/billing/store";
import {
  authorize,
  oblioRead,
  OblioError,
  type OblioSeries,
} from "@/lib/billing/oblio";

export type BillingState =
  | { error?: string; success?: string; invoiceId?: string; clientId?: string }
  | undefined;
const text = (f: FormData, key: string, max = 500) =>
  String(f.get(key) ?? "")
    .trim()
    .slice(0, max);
const emailValid = (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const uuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
function done() {
  revalidatePath("/admin/facturare", "layout");
}

export async function saveCompany(
  _: BillingState,
  f: FormData,
): Promise<BillingState> {
  const db = await billingDb();
  const name = text(f, "name"),
    cui = text(f, "cui", 20).replace(/\s/g, "").toUpperCase(),
    address = text(f, "address");
  const vat = text(f, "vat", 6).replace(",", "."),
    due = text(f, "due", 3);
  if (!name || !address || !/^(RO)?\d{2,10}$/.test(cui))
    return { error: "Completează denumirea, CUI-ul și adresa firmei." };
  if (
    !/^\d{1,3}(\.\d{1,2})?$/.test(vat) ||
    Number(vat) > 100 ||
    !/^\d{1,3}$/.test(due) ||
    Number(due) > 365
  )
    return {
      error: "Verifică TVA-ul (0–100%) și termenul de plată (0–365 zile).",
    };
  const email = text(f, "email", 254),
    accountant = text(f, "accountant", 254);
  if (!emailValid(email) || !emailValid(accountant))
    return { error: "Adresa de e-mail nu este validă." };
  const { data: existing, error: readError } = await db
    .from("billing_company_settings")
    .select("cui")
    .eq("id", 1)
    .maybeSingle();
  if (readError) return { error: "Datele firmei nu au putut fi citite." };
  if (existing && existing.cui !== cui) {
    const { count, error } = await db
      .from("billing_invoices")
      .select("id", { count: "exact", head: true })
      .neq("status", "draft");
    if (error || count)
      return {
        error:
          "CUI-ul nu poate fi schimbat după începerea emiterii facturilor.",
      };
    const { data: connection } = await db
      .from("billing_oblio_connections")
      .select("enabled")
      .eq("company_id", 1)
      .maybeSingle();
    if (connection?.enabled)
      return {
        error:
          "CUI-ul este asociat conexiunii Oblio. Păstrează firma configurată.",
      };
  }
  const { error } = await db.from("billing_company_settings").upsert({
    id: 1,
    name,
    cui,
    address,
    registration_number: text(f, "registration") || null,
    email: email || null,
    phone: text(f, "phone", 40) || null,
    vat_payer: f.get("vatPayer") === "on",
    default_vat_rate: Number(vat),
    default_due_days: Number(due),
    accountant_email: accountant || null,
  });
  if (error) return { error: "Datele firmei nu au putut fi salvate." };
  done();
  return { success: "Datele firmei au fost salvate." };
}

export async function saveClient(
  _: BillingState,
  f: FormData,
): Promise<BillingState> {
  const db = await billingDb();
  const id = text(f, "id", 36),
    name = text(f, "name"),
    cui = text(f, "cui", 20).replace(/\s/g, "").toUpperCase(),
    email = text(f, "email", 254);
  if (id && !uuid(id)) return { error: "Client invalid." };
  if (!name && !cui) return { error: "Introdu numele sau CUI-ul clientului." };
  if (cui && !/^(RO)?\d{2,10}$/.test(cui))
    return {
      error: "CUI-ul trebuie să conțină 2–10 cifre, opțional precedate de RO.",
    };
  if (!emailValid(email)) return { error: "Adresa de e-mail nu este validă." };
  const data = {
    name: name || null,
    cui: cui || null,
    email: email || null,
    phone: text(f, "phone", 40) || null,
    address: text(f, "address") || null,
    city: text(f, "city", 100) || null,
    county: text(f, "county", 100) || null,
    client_type: f.get("type") === "person" ? "person" : "company",
    vat_payer: f.get("vatPayer") === "on",
  };
  const result = id
    ? await db
        .from("billing_clients")
        .update(data)
        .eq("id", id)
        .select("id")
        .single()
    : await db.from("billing_clients").insert(data).select("id").single();
  if (result.error)
    return {
      error:
        result.error.code === "23505"
          ? "Există deja un client cu acest CUI."
          : "Clientul nu a putut fi salvat.",
    };
  done();
  return { success: "Clientul a fost salvat." };
}

export async function saveSeries(
  _: BillingState,
  f: FormData,
): Promise<BillingState> {
  const db = await billingDb();
  const name = text(f, "name", 50),
    kind = text(f, "kind", 20);
  if (!name || !["invoice", "proforma", "credit_note"].includes(kind))
    return { error: "Completează seria și tipul documentului." };
  const { error } = await db
    .from("billing_series")
    .upsert(
      { company_id: 1, name, document_type: kind, active: true },
      { onConflict: "company_id,name,document_type" },
    );
  if (error) return { error: "Salvează întâi datele firmei, apoi seria." };
  done();
  return {
    success: "Seria a fost salvată. Numerele vor fi atribuite de Oblio.",
  };
}

export async function saveBank(
  _: BillingState,
  f: FormData,
): Promise<BillingState> {
  const db = await billingDb();
  const bank = text(f, "bank", 100),
    iban = text(f, "iban", 80).replace(/\s/g, "").toUpperCase();
  if (!bank || !/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban))
    return { error: "Completează banca și un IBAN valid." };
  const digits = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (c) =>
    String(c.charCodeAt(0) - 55),
  );
  if (BigInt(digits) % BigInt(97) !== BigInt(1))
    return { error: "IBAN-ul nu trece verificarea cifrelor de control." };
  const { error } = await db
    .from("billing_bank_accounts")
    .upsert({ company_id: 1, bank_name: bank, iban }, { onConflict: "iban" });
  if (error)
    return { error: "Salvează întâi datele firmei, apoi contul bancar." };
  done();
  return { success: "Contul bancar a fost salvat." };
}

export async function connectOblio(
  _: BillingState,
  f: FormData,
): Promise<BillingState> {
  const db = await billingDb();
  const email = text(f, "email", 254),
    secret = text(f, "secret", 4097);
  if (!email || !emailValid(email) || secret.length < 8 || secret.length > 4096)
    return { error: "Introdu e-mailul contului Oblio și Client Secret." };
  const { data: company, error } = await db
    .from("billing_company_settings")
    .select("cui")
    .eq("id", 1)
    .maybeSingle();
  if (error || !company)
    return {
      error:
        "Salvează întâi datele firmei din secțiunea de mai jos, apoi conectează Oblio.",
    };
  try {
    const token = await authorize(email, secret);
    const companies = await oblioRead<{ cif: string; company: string }[]>(
      "/nomenclature/companies",
      token,
    );
    const match = Array.isArray(companies)
      ? companies.find(
          (c) => c.cif.replace(/^RO/i, "") === company.cui.replace(/^RO/i, ""),
        )
      : undefined;
    if (!match)
      return {
        error:
          "CUI-ul firmei salvate nu există în acest cont Oblio. Verifică firma din Datele firmei.",
      };
    const series = await oblioRead<OblioSeries[]>(
      `/nomenclature/series?cif=${encodeURIComponent(match.cif)}`,
      token,
    );
    if (!Array.isArray(series) || !series.some((s) => s.type === "Factura"))
      return {
        error:
          "Creează cel puțin o serie de facturi în contul Oblio, apoi reconectează.",
      };
    const rows = series.flatMap((s) =>
      s.type === "Factura"
        ? [
            {
              company_id: 1,
              name: s.name,
              document_type: "invoice",
              active: true,
            },
            {
              company_id: 1,
              name: s.name,
              document_type: "credit_note",
              active: true,
            },
          ]
        : s.type === "Proforma"
          ? [
              {
                company_id: 1,
                name: s.name,
                document_type: "proforma",
                active: true,
              },
            ]
          : [],
    );
    const saved = await db
      .from("billing_series")
      .upsert(rows, { onConflict: "company_id,name,document_type" });
    if (saved.error) return { error: "Seriile Oblio nu au putut fi salvate." };
    const connection = await db.rpc("billing_save_oblio", {
      p_email: email,
      p_secret: secret,
    });
    if (connection.error)
      return {
        error:
          "Conexiunea a fost verificată, dar nu a putut fi salvată. Reîncearcă.",
      };
  } catch (e) {
    return {
      error:
        e instanceof OblioError
          ? e.message
          : "Conexiunea Oblio nu a putut fi verificată.",
    };
  }
  done();
  return {
    success:
      "Oblio este conectat. Seriile de facturi și proforme au fost preluate automat.",
  };
}
