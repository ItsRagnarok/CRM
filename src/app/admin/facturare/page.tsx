import Link from "next/link";
import {
  FileText,
  Receipt,
  Banknote,
  Settings,
  ArrowRight,
} from "lucide-react";
import { billingDb, workflow } from "@/lib/billing/store";
import { requireAdminContext } from "@/lib/auth";
import { money } from "@/lib/billing/money";
import type { Dashboard } from "@/lib/billing/types";
import { card, InvoiceList, SectionTitle } from "./ui";
export default async function BillingHome() {
  const db = await billingDb();
  const [dashboard, company, connection, admin] = await Promise.all([
    workflow<Dashboard>("dashboard"),
    db
      .from("billing_company_settings")
      .select("name")
      .eq("id", 1)
      .maybeSingle(),
    db
      .from("billing_oblio_connections")
      .select("enabled")
      .eq("company_id", 1)
      .maybeSingle(),
    requireAdminContext(),
  ]);
  if (company.error || connection.error)
    throw new Error("Datele nu au putut fi încărcate.");
  return (
    <div className="space-y-7">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">
            {company.data?.name ?? "Firma ta"}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            Bună, {admin.fullName.split(" ")[0] || "administrator"}!
          </h1>
        </div>
        <Link
          href="/admin/facturare/setari"
          aria-label="Setări facturare"
          className="rounded-full border border-border bg-white p-3"
        >
          <Settings />
        </Link>
      </header>
      <section className="rounded-[24px] bg-purple p-6 text-white sm:p-8">
        <p className="text-sm opacity-90">
          Încasat în{" "}
          {new Intl.DateTimeFormat("ro-RO", {
            month: "long",
            timeZone: "Europe/Bucharest",
          }).format(new Date())}
        </p>
        <p className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
          {money(dashboard.collected)}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            ["De încasat", dashboard.outstanding, "outstanding"],
            ["Restante", dashboard.overdue, "overdue"],
          ].map(([label, sum, filter]) => (
            <Link
              key={label}
              href={`/admin/facturare/facturi?filter=${filter}`}
              className="rounded-2xl bg-white/15 p-4"
            >
              <p className="text-sm opacity-90">{label}</p>
              <p className="mt-1 text-xl font-bold">{money(sum)}</p>
            </Link>
          ))}
        </div>
      </section>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Factură", href: "/facturi/noua", Icon: FileText },
          {
            label: "Proformă",
            href: "/facturi/noua?tip=proforma",
            Icon: Receipt,
          },
          {
            label: "Încasare",
            href: "/facturi?filter=outstanding",
            Icon: Banknote,
          },
        ].map(({ label, href, Icon }) => (
          <Link
            key={label}
            href={"/admin/facturare" + href}
            className={`${card} flex flex-col items-center gap-3 text-center font-bold hover:border-purple`}
          >
            <Icon className="text-purple" />
            {label}
          </Link>
        ))}
      </div>
      {!connection.data?.enabled && (
        <Link
          href="/admin/facturare/setari#oblio"
          className="flex items-center justify-between gap-4 rounded-2xl border border-purple/20 bg-purple-soft p-5"
        >
          <div>
            <p className="font-bold text-purple">
              Conectează Oblio pentru prima factură
            </p>
            <p className="mt-1 text-sm text-muted">
              Ai nevoie de e-mailul contului și Client Secret.
            </p>
          </div>
          <ArrowRight className="shrink-0 text-purple" />
        </Link>
      )}
      <section>
        <SectionTitle>Necesită atenție</SectionTitle>
        {dashboard.attention.length ? (
          <InvoiceList rows={dashboard.attention} />
        ) : (
          <p className={`${card} text-sm text-muted`}>
            Nu ai facturi restante sau emiteri de verificat.
          </p>
        )}
      </section>
      <section>
        <SectionTitle href="/admin/facturare/facturi">
          Ultimele facturi
        </SectionTitle>
        <InvoiceList rows={dashboard.latest} />
      </section>
    </div>
  );
}
