import { billingDb } from "@/lib/billing/store";
import { CompanyForm, BankForm, SeriesForm, OblioForm } from "../forms";

export default async function BillingSettings() {
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
  const card = "rounded-2xl border border-border bg-white p-5 sm:p-6";
  return (
    <div className="space-y-6">
      <section className={card}>
        <h2 className="mb-5 text-lg font-bold">Datele firmei</h2>
        <CompanyForm company={company.data} />
      </section>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className={card}>
          <h2 className="mb-2 text-lg font-bold">Serie și numerotare</h2>
          <p className="mb-4 text-sm text-muted">
            Numărul final este atribuit de Oblio la emitere.
          </p>
          <ul className="mb-5 divide-y divide-border">
            {series.data?.map((s) => (
              <li key={s.id} className="flex justify-between py-3 text-sm">
                <strong>{s.name}</strong>
                <span className="text-muted">
                  {s.document_type === "invoice"
                    ? "Factură"
                    : s.document_type === "proforma"
                      ? "Proformă"
                      : "Stornare"}
                </span>
              </li>
            ))}
          </ul>
          <SeriesForm />
        </section>
        <section className={card}>
          <h2 className="mb-2 text-lg font-bold">Conturi bancare</h2>
          <ul className="mb-5 divide-y divide-border">
            {banks.data?.map((b) => (
              <li key={b.id} className="py-3 text-sm">
                <strong>{b.bank_name}</strong>
                <p className="mt-1 break-all text-muted">
                  {b.iban} · {b.currency}
                </p>
              </li>
            ))}
          </ul>
          <BankForm />
        </section>
      </div>
      <section className={card}>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold">Conexiune Oblio</h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${connection.data?.enabled ? "bg-success-bg text-success" : "bg-neutral-bg text-neutral"}`}
          >
            {connection.data?.enabled ? "Conexiune verificată" : "Neconectat"}
          </span>
        </div>
        <OblioForm
          email={connection.data?.account_email}
          series={(series.data ?? [])
            .filter((s) => s.document_type === "invoice")
            .map((s) => s.name)}
        />
      </section>
      <section className={card}>
        <h2 className="text-lg font-bold">Modelul facturii</h2>
        <p className="mt-2 text-sm text-muted">
          Facturile vor folosi modelul configurat în contul Oblio: logo, culori
          și mențiuni de subsol.
        </p>
        <a
          href="https://www.oblio.eu/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-semibold text-purple hover:underline"
        >
          Deschide Oblio ↗
        </a>
      </section>
    </div>
  );
}
