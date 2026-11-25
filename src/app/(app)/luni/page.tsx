import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, Phone, SlidersHorizontal } from "lucide-react";
import { requireSessionContext, isBackOfficeRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todayInOrgTimeZone } from "@/lib/date";
import { JOB_TYPE_LABELS } from "@/lib/status";
import {
  METRIC_IDS, METRICS, formatValue, lei, marginPct, metricState, parseConfig, thresholdText,
  type Group, type MetricId, type MondayReport,
} from "@/lib/monday";
import { ConfigForm } from "./config-form";

const STATE_STYLE = {
  peste: { card: "border-[#f3b4ae]", chip: "bg-danger-bg text-danger", text: "Peste prag" },
  ok: { card: "border-border", chip: "bg-success-bg text-success", text: "În prag" },
  fara_prag: { card: "border-border", chip: "bg-neutral-bg text-muted", text: "Fără prag" },
  fara_date: { card: "border-border", chip: "bg-neutral-bg text-muted", text: "Fără date" },
};

function weekLabel(today: string) {
  const d = new Date(`${today}T12:00:00Z`);
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const f = (x: Date, month: boolean) => x.toLocaleDateString("ro-RO", { timeZone: "UTC", day: "numeric", ...(month ? { month: "long" } : {}) });
  return `Săptămâna ${f(monday, monday.getUTCMonth() !== sunday.getUTCMonth())}–${f(sunday, true)}`;
}

function MarginTable({ title, rows, label, threshold }: { title: string; rows: Group[]; label: (k: string) => string; threshold: number | undefined }) {
  const max = Math.max(1, ...rows.map((r) => r.billed));
  return (
    <div className="min-w-0">
      <h3 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-muted">{title}</h3>
      {rows.length === 0 ? <p className="text-[13px] text-muted">Nimic încă.</p> : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((r) => {
            const pct = marginPct(r.billed, r.cost) ?? 0;
            const low = threshold !== undefined && pct < threshold;
            return (
              <li key={r.key} className="text-[13px]">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-semibold">{label(r.key)} <span className="font-normal text-muted">· {r.jobs} {r.jobs === 1 ? "lucrare" : "lucrări"}</span></span>
                  <span className={`font-extrabold tabular-nums ${pct < 0 ? "text-danger" : low ? "text-warning" : "text-success"}`}>{pct}% · {lei(r.billed - r.cost)}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-bg" title={`Facturat ${lei(r.billed)}, cost ${lei(r.cost)}`}>
                  <div className="h-full rounded-full bg-[#1f2024]" style={{ width: `${Math.max(2, (100 * r.billed) / max)}%` }} />
                </div>
                <div className="mt-0.5 text-[11.5px] text-muted">Facturat {lei(r.billed)} · cost {lei(r.cost)}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Ecranul de luni dimineață al patronului: cele 3 cifre alese, apoi restanțele pe vechime și marja pe tip și pe echipă. */
export default async function LuniPage({ searchParams }: { searchParams: Promise<{ alege?: string }> }) {
  const sp = await searchParams;
  const { organization, profile } = await requireSessionContext();
  if (!isBackOfficeRole(profile.role)) redirect("/dashboard");
  const supabase = await createClient();
  const today = todayInOrgTimeZone();
  const [{ data: raw, error }, { data: org }] = await Promise.all([
    supabase.rpc("monday_report", { p_today: today }),
    supabase.from("organizations").select("monday_config").eq("id", organization.id).maybeSingle(),
  ]);
  if (error || !raw) return <p role="alert" className="p-7 text-danger">Nu am putut calcula cifrele. Reîncarcă pagina.</p>;
  const r = raw as unknown as MondayReport;
  const cfg = parseConfig(org?.monday_config);
  const isAdmin = profile.role === "admin";
  const breaches = cfg.metrics.filter((id) => metricState(id, r, cfg) === "peste");
  const others = METRIC_IDS.filter((id) => !cfg.metrics.includes(id));
  const bucketMax = Math.max(1, ...r.restante.buckets.map((b) => b.amount));

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold text-foreground">Luni dimineața</h1>
          <p className="mt-1 text-[13px] text-muted">{weekLabel(today)} · {breaches.length === 0 ? "cifrele alese sunt în prag" : `${breaches.length} ${breaches.length === 1 ? "cifră" : "cifre"} peste prag`}</p>
        </div>
        {isAdmin && (
          <Link href={sp.alege ? "/luni" : "/luni?alege=1#alege"} className="flex items-center gap-1.5 rounded-[10px] border border-border bg-white px-3.5 py-2 text-[13px] font-bold">
            <SlidersHorizontal className="h-4 w-4" /> {sp.alege ? "Închide alegerea" : "Alege cifrele și pragurile"}
          </Link>
        )}
      </div>

      {isAdmin && sp.alege && (
        <section id="alege" className="rounded-[13px] border border-border bg-white p-4 sm:p-5">
          <h2 className="mb-2 text-[15px] font-bold">Ce cifre vrei să vezi luni dimineața</h2>
          <ConfigForm config={cfg} />
        </section>
      )}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3" aria-label="Cifrele alese">
        {cfg.metrics.map((id: MetricId) => {
          const d = METRICS[id];
          const st = metricState(id, r, cfg);
          const s = STATE_STYLE[st];
          return (
            <article key={id} className={`flex flex-col gap-2 rounded-[13px] border bg-white p-4 ${s.card}`}>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-[13.5px] font-bold text-foreground">{d.label}</h2>
                <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${s.chip}`}>
                  {st === "peste" ? <AlertTriangle className="h-3 w-3" /> : st === "ok" ? <CheckCircle2 className="h-3 w-3" /> : null}{s.text}
                </span>
              </div>
              <div className="text-[30px] font-extrabold leading-none tabular-nums tracking-tight">{formatValue(id, d.value(r))}</div>
              <p className="text-[12.5px] text-muted">{d.sub(r)}</p>
              <p className="text-[11.5px] font-semibold text-muted-2">{thresholdText(id, cfg.thresholds[id])}</p>
              {st === "peste" && <p className="rounded-lg bg-danger-bg/60 p-2.5 text-[12.5px] text-foreground">{d.action}</p>}
              <Link href={d.href} className="mt-auto self-start text-[13px] font-bold text-accent-ink">{d.hrefLabel} →</Link>
            </article>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section id="restante" className="min-w-0 scroll-mt-4 rounded-[13px] border border-border bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[15px] font-bold">Restanțe pe vechime</h2>
            <span className="text-[13px] font-extrabold tabular-nums">{lei(r.restante.total)}</span>
          </div>
          <p className="mt-1 text-[12.5px] text-muted">Facturi neplătite, după câte zile au trecut de scadență. Legea 72/2013 pune termen de plată de cel mult 60 de zile între firme.</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {r.restante.buckets.map((b, i) => (
              <li key={b.label} className={`rounded-xl border p-3 ${i >= 2 && b.amount > 0 ? "border-[#f3b4ae] bg-danger-bg/40" : i === 1 && b.amount > 0 ? "border-[#f5d9a8] bg-warning-bg/50" : "border-border"}`}>
                <div className="text-[11.5px] font-bold uppercase tracking-wide text-muted">{b.label}</div>
                <div className="mt-1 text-[17px] font-extrabold tabular-nums">{lei(b.amount)}</div>
                <div className="text-[11.5px] text-muted">{b.count} {b.count === 1 ? "factură" : "facturi"}</div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-bg"><div className="h-full rounded-full bg-[#1f2024]" style={{ width: `${(100 * b.amount) / bucketMax}%` }} /></div>
              </li>
            ))}
          </ul>
          {r.restante.not_due > 0 && <p className="mt-2 text-[12px] text-muted">Încă în termen: {lei(r.restante.not_due)} ({r.restante.not_due_count} facturi).</p>}
          <h3 className="mt-4 text-[13px] font-bold uppercase tracking-wide text-muted">Pe cine suni întâi</h3>
          {r.restante.clients.length === 0 ? <p className="mt-1 text-[13px] text-muted">Nicio restanță. Bine.</p> : (
            <ul className="mt-1 divide-y divide-border">
              {r.restante.clients.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-[13px]">
                  <Link href={`/clienti/${c.id}`} className="min-w-0 flex-1 font-semibold hover:underline">{c.name}</Link>
                  <span className={`tabular-nums ${c.oldest > 60 ? "font-bold text-danger" : c.oldest > 30 ? "font-bold text-warning" : "text-muted"}`}>{c.oldest} zile</span>
                  <span className="w-28 text-right font-extrabold tabular-nums">{lei(c.amount)}</span>
                  {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[12px] font-bold"><Phone className="h-3 w-3" /> Sună</a>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="marja" className="min-w-0 scroll-mt-4 rounded-[13px] border border-border bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[15px] font-bold">Marjă pe tip de lucrare și pe echipă</h2>
            <span className="text-[13px] font-extrabold tabular-nums">{marginPct(r.marja.billed, r.marja.cost) ?? "—"}%</span>
          </div>
          <p className="mt-1 text-[12.5px] text-muted">
            Lucrările facturate în ultimele 90 de zile. Marja = facturat − (ore pe teren × tariful orar al oamenilor + materiale folosite + cheltuieli aprobate).
            {r.marja.missing > 0 && ` ${r.marja.missing} ${r.marja.missing === 1 ? "lucrare nu are" : "lucrări nu au"} orele de început și sfârșit, deci nu intră în calcul.`}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <MarginTable title="Pe tip de lucrare" rows={r.marja.by_type} label={(k) => JOB_TYPE_LABELS[k as keyof typeof JOB_TYPE_LABELS] ?? k} threshold={cfg.thresholds.marja} />
            <MarginTable title="Pe echipă" rows={r.marja.by_team} label={(k) => k} threshold={cfg.thresholds.marja} />
          </div>
          <p className="mt-3 text-[11.5px] text-muted">Dacă cineva nu are tarif orar în Setări → Echipă, manopera lui se numără 0 și marja iese mai mare decât e.</p>
        </section>
      </div>

      <section className="rounded-[13px] border border-border bg-white p-4 sm:p-5">
        <h2 className="text-[15px] font-bold">Celelalte cifre</h2>
        <ul className="mt-2 grid grid-cols-1 gap-x-6 sm:grid-cols-2 xl:grid-cols-3">
          {others.map((id) => (
            <li key={id} className="flex items-baseline justify-between gap-3 border-b border-border py-2.5 text-[13px] last:border-0">
              <Link href={METRICS[id].href} className="min-w-0 text-muted hover:text-foreground">{METRICS[id].label}</Link>
              <span className="shrink-0 font-extrabold tabular-nums">{formatValue(id, METRICS[id].value(r))}</span>
            </li>
          ))}
        </ul>
        {isAdmin && <p className="mt-2 text-[12px] text-muted">Le poți muta sus din „Alege cifrele și pragurile”.</p>}
      </section>
    </div>
  );
}
