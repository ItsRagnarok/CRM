import Link from "next/link";
import { billingDb } from "@/lib/billing/store";
import { ClientForm } from "../forms";
import { QuickClient } from "../workflow-forms";
import { money } from "@/lib/billing/money";

export default async function BillingClients({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 100),
    page = Math.max(
      1,
      Math.min(4000, Number.parseInt(params.page ?? "1", 10) || 1),
    );
  const db = await billingDb();
  const { data, error } = await db.rpc("billing_client_balances", {
    p_search: q,
    p_offset: (page - 1) * 25,
  });
  if (error) throw new Error("Clienții nu au putut fi încărcați.");
  const rows = (data ?? []).slice(0, 25);
  const href = (p: number) =>
    `/admin/facturare/clienti?q=${encodeURIComponent(q)}&page=${p}`;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Clienți</h1>
      <section className="rounded-[24px] bg-purple p-6 text-white">
        <h2 className="text-lg font-bold">Adaugă un client doar cu CUI</h2>
        <p className="mb-4 mt-2 text-sm opacity-90">
          Preluăm datele clienților existenți în contul Oblio. Pentru un client
          nou poți completa apoi datele fiscale.
        </p>
        <QuickClient />
      </section>
      <details className="rounded-2xl border border-border bg-white p-5">
        <summary className="cursor-pointer font-bold text-purple">
          Adaugă un client
        </summary>
        <div className="mt-5">
          <ClientForm />
        </div>
      </details>
      <form className="flex gap-3">
        <label className="flex-1">
          <span className="sr-only">Caută după nume sau CUI</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Caută după nume sau CUI"
            maxLength={100}
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
          />
        </label>
        <button className="rounded-xl bg-purple px-5 py-3 text-sm font-bold text-white">
          Caută
        </button>
      </form>
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex justify-between border-b border-border px-5 py-3 text-xs font-bold uppercase text-muted">
          <span>Client</span>
          <span>De încasat</span>
        </div>
        {rows.map((c) => (
          <Link
            key={c.id}
            href={`/admin/facturare/clienti/${c.id}`}
            className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 last:border-0 hover:bg-purple-soft"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-soft font-bold text-purple">
                {(c.name ?? c.cui ?? "C").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold">
                  {c.name ?? "Client de completat"}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  {c.cui ? `CUI ${c.cui}` : "Persoană fizică · fără CUI"}
                </p>
              </div>
            </div>
            <span className="shrink-0 text-sm font-bold">
              {money(c.balance)}
            </span>
          </Link>
        ))}
        {!rows.length && (
          <p className="p-8 text-center text-sm text-muted">
            {q
              ? "Nu am găsit clienți pentru această căutare."
              : "Nu ai adăugat încă niciun client."}
          </p>
        )}
      </div>
      <div className="flex justify-between text-sm font-semibold text-purple">
        {page > 1 ? (
          <Link href={href(page - 1)}>← Pagina anterioară</Link>
        ) : (
          <span />
        )}
        {(data?.length ?? 0) > 25 && (
          <Link href={href(page + 1)}>Pagina următoare →</Link>
        )}
      </div>
    </div>
  );
}
