import { Building2, Link2, Landmark, Hash, FileText, Mail } from "lucide-react";
import { billingDb } from "@/lib/billing/store";
import { CompanyForm, BankForm, OblioForm } from "../forms";
import { card } from "../ui";
export default async function Settings() {
  const db = await billingDb();
  const [company, banks, series, connection] = await Promise.all([
    db.from("billing_company_settings").select("*").eq("id", 1).maybeSingle(),
    db.from("billing_bank_accounts").select("*").order("bank_name"),
    db.from("billing_series").select("*").eq("active", true).order("name"),
    db
      .from("billing_oblio_connections")
      .select("account_email,enabled,verified_at")
      .eq("company_id", 1)
      .maybeSingle(),
  ]);
  if (company.error || banks.error || series.error || connection.error)
    throw new Error("Setările nu au putut fi încărcate.");
  const c = company.data;
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Setări facturare</h1>
      <div className={card + " flex items-center gap-4"}>
        <div className="rounded-full bg-purple p-4 text-white">
          <Building2 />
        </div>
        <div>
          <h2 className="font-bold">{c?.name ?? "Datele firmei tale"}</h2>
          <p className="mt-1 text-sm text-muted">
            {c
              ? `CUI ${c.cui} · ${c.address}`
              : "1. Completează firma · 2. Conectează Oblio"}
          </p>
        </div>
      </div>
      <section id="oblio" className={card}>
        <div className="mb-4 flex items-center gap-3">
          <Link2 className="text-purple" />
          <h2 className="font-bold">
            {connection.data?.enabled
              ? "Conectat la Oblio"
              : "Conectează Oblio"}
          </h2>
          <span
            className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${connection.data?.enabled ? "bg-success-bg text-success" : "bg-neutral-bg text-muted"}`}
          >
            {connection.data?.enabled ? "Verificat" : "Neconectat"}
          </span>
        </div>
        <OblioForm email={connection.data?.account_email} />
      </section>
      <div className="overflow-hidden rounded-[20px] border border-border bg-white">
        <details open={!c} className="border-b border-border p-5">
          <summary className="cursor-pointer font-bold">
            Datele firmei și TVA
          </summary>
          <p className="mt-1 text-sm text-muted">
            {c
              ? `${c.vat_payer ? "Plătitor" : "Neplătitor"} de TVA · cotă implicită ${c.default_vat_rate}%`
              : "Denumire, CUI, adresă și TVA implicit 21%"}
          </p>
          <div className="mt-5">
            <CompanyForm company={c} />
          </div>
        </details>
        <details className="border-b border-border p-5">
          <summary className="cursor-pointer font-bold">
            <Hash size={16} className="mr-2 inline" />
            Serie și numerotare
          </summary>
          <p className="mt-1 text-sm text-muted">
            Serii preluate din Oblio. Numărul este atribuit doar la emitere.
          </p>
          <ul className="mt-3 divide-y divide-border">
            {series.data?.map((s) => (
              <li key={s.id} className="flex justify-between py-3 text-sm">
                <strong>{s.name}</strong>
                <span>
                  {s.document_type === "invoice"
                    ? "Factură"
                    : s.document_type === "proforma"
                      ? "Proformă"
                      : "Stornare"}
                </span>
              </li>
            ))}
          </ul>
          {!series.data?.length && (
            <p className="mt-3 text-sm text-muted">
              Conectează Oblio pentru a prelua seriile existente.
            </p>
          )}
          <p className="mt-3 text-xs text-muted">
            Configurezi seriile și următorul număr în Oblio. Reconectarea
            actualizează lista.
          </p>
        </details>
        <details className="border-b border-border p-5">
          <summary className="cursor-pointer font-bold">
            <Landmark size={16} className="mr-2 inline" />
            Conturi bancare
          </summary>
          <p className="mt-1 text-sm text-muted">
            Apar pe PDF-ul generat de ElectroField.
          </p>
          <ul className="my-4 divide-y divide-border">
            {banks.data?.map((b) => (
              <li key={b.id} className="py-2 text-sm">
                <strong>{b.bank_name}</strong>
                <p className="break-all text-muted">{b.iban}</p>
              </li>
            ))}
          </ul>
          <BankForm />
        </details>
        <details className="border-b border-border p-5">
          <summary className="cursor-pointer font-bold">
            <FileText size={16} className="mr-2 inline" />
            Modelul facturii
          </summary>
          <p className="mt-3 text-sm text-muted">
            Factura din Oblio folosește modelul ales în contul tău. PDF-ul
            descărcat din ElectroField folosește datele fiscale salvate la
            emitere și formatul ElectroField.
          </p>
          <a
            href="https://www.oblio.eu/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-purple"
          >
            Configurează modelul în Oblio ↗
          </a>
        </details>
        <details className="p-5">
          <summary className="cursor-pointer font-bold">
            <Mail size={16} className="mr-2 inline" />
            Contabil
          </summary>
          <p className="mt-3 text-sm text-muted">
            {c?.accountant_email ??
              "Adaugă e-mailul contabilului în Datele firmei."}{" "}
            Exportul lunar PDF + Excel este disponibil în Rapoarte.
          </p>
        </details>
      </div>
    </div>
  );
}
