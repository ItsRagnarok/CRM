import Link from "next/link";
import { Settings, Users, CheckCircle2, Circle } from "lucide-react";
import { billingDb } from "@/lib/billing/store";

export default async function BillingHome() {
  const db = await billingDb();
  const [company, connection, clients] = await Promise.all([
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
    db
      .from("billing_clients")
      .select("id", { head: true, count: "exact" })
      .eq("archived", false),
  ]);
  if (company.error || connection.error || clients.error)
    throw new Error("Datele de facturare nu au putut fi încărcate.");
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-graphite p-7 text-white">
        <p className="text-sm text-[#c9c3e0]">
          {company.data?.name ?? "Firma ta"}
        </p>
        <h2 className="mt-2 text-2xl font-bold">
          Pregătește facturarea prin Oblio
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#c9c3e0]">
          Configurează firma, conectează contul Oblio și adaugă clienții.
          Emiterea facturilor va fi disponibilă în etapa următoare.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          [
            "/admin/facturare/setari",
            "Setări facturare",
            "Datele firmei, serii, conturi bancare și conexiunea Oblio",
            Settings,
          ],
          [
            "/admin/facturare/clienti",
            "Clienți",
            `${clients.count ?? 0} clienți în evidență`,
            Users,
          ],
        ].map(([href, title, description, Icon]) => {
          const Symbol = Icon as typeof Users;
          return (
            <Link
              key={String(href)}
              href={String(href)}
              className="rounded-2xl border border-border bg-white p-6 hover:border-purple"
            >
              <Symbol className="mb-4 h-6 w-6 text-purple" />
              <h2 className="font-bold">{String(title)}</h2>
              <p className="mt-2 text-sm text-muted">{String(description)}</p>
            </Link>
          );
        })}
      </div>
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-4 font-bold">Configurare</h2>
        {[
          ["Datele firmei", !!company.data],
          ["Conexiunea Oblio", !!connection.data?.enabled],
          ["Primul client", !!clients.count],
        ].map(([label, ready]) => {
          const Icon = ready ? CheckCircle2 : Circle;
          return (
            <p
              key={String(label)}
              className="mt-3 flex items-center gap-3 text-sm"
            >
              <Icon
                className={`h-5 w-5 ${ready ? "text-success" : "text-muted"}`}
              />
              {label}
              <span className="ml-auto text-muted">
                {ready ? "Pregătit" : "De completat"}
              </span>
            </p>
          );
        })}
      </div>
    </div>
  );
}
