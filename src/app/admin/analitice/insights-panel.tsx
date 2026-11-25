"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Sparkles, RefreshCw, Check, Copy, ListChecks } from "lucide-react";
import { INSIGHT_PERIODS, type InsightPeriod, type Recommendation } from "@/lib/site-insights";
import { runSiteAnalysis, toggleApplied, type InsightRow } from "./insights-actions";

const AUTO_AFTER_MS = 6 * 3_600_000;
const IMPACT: Record<string, string> = { mare: "bg-[#fde7e5] text-[#b42318]", mediu: "bg-[#fff4e5] text-[#9a3412]", mic: "bg-[#eef1f5] text-[#475467]" };

function when(iso: string) {
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (min < 1) return "acum";
  if (min < 60) return `acum ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `acum ${h} h`;
  return new Date(iso).toLocaleString("ro-RO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" });
}

function asTask(r: Recommendation) {
  return [`Aplică recomandarea din Analitice: „${r.title}”.`, `De ce: ${r.why}`, "Pași:", ...r.steps.map((s, i) => `${i + 1}. ${s}`), r.link ? `Pagina: https://www.electrofield.ro${r.link.href}` : ""].filter(Boolean).join("\n");
}

function RecCard({ r, applied, onToggle }: { r: Recommendation; applied: boolean; onToggle: (on: boolean) => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <li className={`flex flex-col gap-2 rounded-xl border p-4 ${applied ? "border-[#b7e4c7] bg-[#f3fbf6]" : "border-border bg-white"}`}>
      <div className="flex flex-wrap items-start gap-2">
        <h3 className={`min-w-0 basis-full text-[14.5px] font-bold sm:basis-0 sm:flex-1 ${applied ? "text-muted line-through" : "text-foreground"}`}>{r.title}</h3>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${IMPACT[r.impact]}`}>impact {r.impact}</span>
        {r.effort && <span className="rounded-full bg-[#eef1f5] px-2 py-0.5 text-[11px] font-bold text-[#475467]">efort {r.effort}</span>}
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${r.source === "ai" ? "bg-[#f1edff] text-[#5b21b6]" : "bg-[#eef1f5] text-[#475467]"}`}>{r.source === "ai" ? "AI" : "din cifre"}</span>
      </div>
      <p className="text-[13px] text-muted">{r.why}</p>
      <ol className="ml-4 list-decimal space-y-1 text-[13px] text-foreground">{r.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => onToggle(!applied)} className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-bold ${applied ? "border-[#b7e4c7] bg-white text-[#15803d]" : "border-border"}`}>
          <Check className="h-3.5 w-3.5" /> {applied ? "Aplicată" : "Marchează aplicată"}
        </button>
        <button
          type="button"
          onClick={() => { navigator.clipboard.writeText(asTask(r)).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {}); }}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-bold"
          title="Copiază recomandarea ca sarcină, ca să mi-o dai să o implementez"
        >
          <Copy className="h-3.5 w-3.5" /> {copied ? "Copiat" : "Copiază ca sarcină"}
        </button>
        {r.link && <Link href={r.link.href} target="_blank" className="text-[12.5px] font-bold text-[#5b21b6]">{r.link.label} ↗</Link>}
      </div>
    </li>
  );
}

/** Analiză automată: la deschidere, dacă ultima analiză pe 24 h e mai veche de 6 ore, se face singură. */
export function InsightsPanel({ history: initial }: { history: InsightRow[] }) {
  const [history, setHistory] = useState(initial);
  const [period, setPeriod] = useState<InsightPeriod>("24h");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const auto = useRef(false);
  const current = history.find((h) => h.period === period) ?? null;

  function run(p: InsightPeriod) {
    setError("");
    start(async () => {
      const res = await runSiteAnalysis(p);
      if (res.error) setError(res.error);
      if (res.row) setHistory((h) => [res.row!, ...h].slice(0, 20));
    });
  }

  useEffect(() => {
    if (auto.current) return;
    auto.current = true;
    const last = initial.find((h) => h.period === "24h");
    if (!last || Date.now() - Date.parse(last.created_at) > AUTO_AFTER_MS) run("24h");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applied = new Set(Array.isArray(current?.applied) ? (current!.applied as string[]) : []);
  const ai = Array.isArray(current?.ai) ? (current!.ai as Recommendation[]) : [];
  const rules = Array.isArray(current?.rules) ? (current!.rules as Recommendation[]) : [];
  const recs = [...ai, ...rules];
  const s = (current?.summary ?? {}) as { visitors?: number; leads?: number; conversion?: number | null; programareVisitors?: number; aiSummary?: string | null };

  function toggle(recId: string, on: boolean) {
    if (!current) return;
    const id = current.id;
    setHistory((h) => h.map((x) => (x.id === id ? { ...x, applied: on ? [...new Set([...(x.applied as string[] ?? []), recId])] : ((x.applied as string[]) ?? []).filter((y) => y !== recId) } : x)));
    void toggleApplied(id, recId, on);
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-5" aria-label="Analiză și recomandări">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-[16px] font-extrabold"><Sparkles className="h-4 w-4 text-[#7c5cfc]" /> Analiză și recomandări</h2>
          <p className="mt-1 max-w-[70ch] text-[12.5px] text-muted">Trece prin tot ce s-a întâmplat pe site (surse, pagini, drumul fiecărui vizitator, telefoane, programări) și îți spune ce să faci ca să ai mai mulți clienți reali. Recomandările „din cifre” vin din reguli fixe; cele „AI” vin de la un model AI gratuit, care primește doar cifre, fără date personale. Pe 24 de ore se reface singură, la cel mult 6 ore.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-0.5 rounded-[9px] bg-neutral-bg p-[3px]">
            {INSIGHT_PERIODS.map((p) => (
              <button key={p.id} type="button" onClick={() => setPeriod(p.id)} className={`rounded-[7px] px-3 py-1.5 text-[12.5px] font-bold ${period === p.id ? "bg-white text-foreground shadow-sm" : "text-muted"}`}>{p.short}</button>
            ))}
          </div>
          <button type="button" disabled={pending} onClick={() => run(period)} className="flex items-center gap-1.5 rounded-[10px] bg-[#7c5cfc] px-3.5 py-2 text-[13px] font-bold text-white disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} /> {pending ? "Analizez…" : "Analizează acum"}
          </button>
        </div>
      </div>

      {error && <p role="alert" className="mt-3 rounded-lg bg-[#fef3f2] p-2.5 text-[12.5px] text-[#b42318]">{error}</p>}

      {!current ? (
        <p className="mt-4 text-[13px] text-muted">{pending ? "Analizez datele…" : `Nicio analiză pe ${INSIGHT_PERIODS.find((p) => p.id === period)?.label.toLowerCase()} încă. Apasă „Analizează acum”.`}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[12.5px] text-muted">
            <span>Analiză {when(current.created_at)} · {INSIGHT_PERIODS.find((p) => p.id === current.period)?.label}</span>
            <span><b className="text-foreground">{s.visitors ?? 0}</b> vizitatori</span>
            <span><b className="text-foreground">{s.programareVisitors ?? 0}</b> au deschis programarea</span>
            <span><b className="text-foreground">{s.leads ?? 0}</b> programări{s.conversion != null ? ` (${s.conversion}%)` : ""}</span>
            {recs.length > 0 && <span className="flex items-center gap-1"><ListChecks className="h-3.5 w-3.5" /> {applied.size}/{recs.length} aplicate</span>}
          </div>
          {s.aiSummary && <p className="rounded-xl bg-[#f6f4ff] p-3 text-[13.5px] text-foreground">{s.aiSummary}</p>}
          {current.ai_error && <p className="text-[12px] text-muted">AI: {current.ai_error}</p>}
          {recs.length === 0 ? (
            <p className="text-[13px] text-muted">Nimic de semnalat în această perioadă.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">{recs.map((r) => <RecCard key={r.id} r={r} applied={applied.has(r.id)} onToggle={(on) => toggle(r.id, on)} />)}</ul>
          )}
        </div>
      )}
    </section>
  );
}
