import { Download, Mail } from "lucide-react";
import { billingDb, workflow } from "@/lib/billing/store";
import { money, todayRo } from "@/lib/billing/money";
import type { Report } from "@/lib/billing/types";
import { card, primary, secondary } from "../ui";
export default async function Reports({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const p = await searchParams;
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(p.month ?? "")
    ? p.month!
    : todayRo().slice(0, 7);
  const db = await billingDb();
  const [r, company] = await Promise.all([
    workflow<Report>("report", { month }),
    db
      .from("billing_company_settings")
      .select("accountant_email")
      .eq("id", 1)
      .maybeSingle(),
  ]);
  if (company.error) throw new Error("Setările nu au putut fi citite.");
  const max = Math.max(1, ...r.months.map((m) => Math.abs(Number(m.revenue))));
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Rapoarte</h1>
      <section className={card}>
        <h2 className="font-semibold">Venituri pe ultimele 6 luni</h2>
        <p className="mt-1 text-xs text-muted">
          Facturi emise fără TVA, minus stornări. Proformele sunt excluse.
        </p>
        <div
          className="mt-8 flex h-52 items-end gap-3"
          role="img"
          aria-label={r.months
            .map((m) => `${m.month}: ${money(m.revenue)}`)
            .join("; ")}
        >
          {r.months.map((m, i) => (
            <div
              key={m.month}
              className="flex h-full min-w-0 flex-1 flex-col justify-end text-center"
            >
              <span
                className="mb-2 truncate text-[10px] font-semibold sm:text-xs"
                title={money(m.revenue)}
              >
                {money(m.revenue).replace(" lei", "")}
              </span>
              <div
                className={`min-h-1 rounded-t-lg ${i === 5 ? "bg-purple" : "bg-purple/30"}`}
                style={{
                  height: `${(Math.abs(Number(m.revenue)) / max) * 75}%`,
                }}
              />
              <span className="mt-2 text-xs text-muted">
                {new Intl.DateTimeFormat("ro-RO", { month: "short" }).format(
                  new Date(m.month + "-15T12:00:00Z"),
                )}
              </span>
            </div>
          ))}
        </div>
      </section>
      <form className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold" htmlFor="month">
          Luna raportului
        </label>
        <input
          id="month"
          name="month"
          type="month"
          defaultValue={month}
          required
          className="rounded-xl border border-border bg-white px-4 py-2"
        />
        <button className={secondary}>Afișează</button>
      </form>
      <div className="grid grid-cols-2 gap-3">
        <section className={card}>
          <p className="text-sm text-muted">TVA colectată estimată</p>
          <p className="mt-2 text-xl font-bold">{money(r.vat)}</p>
        </section>
        <section className={card}>
          <p className="text-sm text-muted">Facturi emise în {month}</p>
          <p className="mt-2 text-xl font-bold">{r.count} documente</p>
        </section>
      </div>
      <p className="text-xs text-muted">
        TVA estimată nu include TVA deductibilă sau ajustările contabilului.
      </p>
      <section className={card}>
        <h2 className="text-lg font-bold">Trimite contabilului</h2>
        <p className="my-3 text-sm text-muted">
          Toate facturile și stornările lunii în PDF și un fișier Excel cu
          totalurile, într-o singură arhivă.
        </p>
        <div className="my-4 rounded-xl bg-neutral-bg p-4 text-sm">
          {company.data?.accountant_email ??
            "Adaugă e-mailul contabilului în Setări → Datele firmei."}
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/api/admin/billing/export?month=${month}`}
            className={primary}
          >
            <Download size={18} />
            Descarcă PDF-uri și Excel
          </a>
          {company.data?.accountant_email && (
            <a
              className={secondary}
              href={`mailto:${encodeURIComponent(company.data.accountant_email)}?subject=${encodeURIComponent("Facturi " + month)}&body=${encodeURIComponent("Bună ziua,\n\nVă trimit documentele pentru luna " + month + ".\n\n[Adăugați arhiva descărcată din ElectroField.]")}`}
            >
              <Mail size={18} />
              Pregătește e-mailul
            </a>
          )}
        </div>
        <p className="mt-4 text-xs text-muted">
          Descarcă arhiva și atașeaz-o mesajului. Trimiterea lunară automată nu
          este activată.
        </p>
      </section>
    </div>
  );
}
