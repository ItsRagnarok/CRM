"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SiteAnalytics = {
  online: number; last30: { t: string; views: number }[];
  visitors: number; views: number; bounce: number | null; prev_visitors: number; prev_views: number;
  series: { t: string; views: number; visitors: number }[];
  pages: { path: string; visitors: number; views: number }[];
  referrers: { name: string; visitors: number }[]; sources: { name: string; visitors: number }[];
  countries: { code: string; visitors: number }[]; devices: { name: string; visitors: number }[];
  recent: { t: string; path: string; country: string | null; device: string; referrer_host: string | null }[];
};
type Period = "24h" | "7d" | "30d";
const PERIODS: { id: Period; label: string }[] = [{ id: "24h", label: "Ultimele 24 de ore" }, { id: "7d", label: "7 zile" }, { id: "30d", label: "30 de zile" }];
const DEVICE: Record<string, string> = { desktop: "Calculator", mobile: "Telefon", tablet: "Tabletă" };
const nf = new Intl.NumberFormat("ro-RO");

function delta(now: number, before: number) {
  if (before === 0) return now > 0 ? { text: "nou", up: true } : null;
  const pct = Math.round(((now - before) / before) * 100);
  return { text: `${pct > 0 ? "+" : ""}${pct}%`, up: pct >= 0 };
}
function ago(iso: string, now: number) {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 60) return `acum ${s} s`;
  if (s < 3600) return `acum ${Math.floor(s / 60)} min`;
  if (s < 86400) return `acum ${Math.floor(s / 3600)} h`;
  return `acum ${Math.floor(s / 86400)} zile`;
}
const country = (code: string | null) => {
  if (!code || code === "??") return "Necunoscută";
  try { return new Intl.DisplayNames(["ro"], { type: "region" }).of(code) ?? code; } catch { return code; }
};

function Area({ points, labels, daily }: { points: number[]; labels: string[]; daily: boolean }) {
  const W = 800, H = 230, L = 34, B = 26, T = 12, R = 8;
  const max = Math.max(1, ...points);
  const niceMax = max <= 4 ? max : Math.ceil(max / 4) * 4;
  const x = (i: number) => L + (points.length <= 1 ? 0 : (i / (points.length - 1)) * (W - L - R));
  const y = (v: number) => T + (1 - v / niceMax) * (H - T - B);
  const line = points.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H - B} L${x(0).toFixed(1)},${H - B} Z`;
  const ticks = niceMax <= 4 ? Array.from({ length: niceMax + 1 }, (_, i) => i) : [0, niceMax / 4, niceMax / 2, (niceMax * 3) / 4, niceMax];
  const step = Math.max(1, Math.ceil(points.length / 6));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={daily ? "Vizitatori pe zile" : "Vizitatori pe ore"} className="h-auto w-full">
      {ticks.map((v) => (
        <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity="0.12" /><text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="currentColor" fillOpacity="0.6">{Math.round(v)}</text></g>
      ))}
      <path d={area} fill="var(--color-purple, #7c5cfc)" fillOpacity="0.16" />
      <path d={line} fill="none" stroke="var(--color-purple, #7c5cfc)" strokeWidth="2.2" strokeLinejoin="round" />
      {points.length > 0 && <circle cx={x(points.length - 1)} cy={y(points[points.length - 1])} r="4" fill="var(--color-purple, #7c5cfc)" />}
      {labels.map((l, i) => (i % step === 0 || i === labels.length - 1) ? <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"} fontSize="11" fill="currentColor" fillOpacity="0.6">{l}</text> : null)}
    </svg>
  );
}

function Spark({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-10 items-end gap-[2px]" aria-label="Afișări pe minut, ultimele 30 de minute" role="img">
      {values.map((v, i) => <span key={i} className="flex-1 rounded-[2px] bg-purple" style={{ height: `${Math.max(v ? 14 : 4, (v / max) * 100)}%`, opacity: v ? 1 : 0.25 }} />)}
    </div>
  );
}

function Bars({ rows, empty }: { rows: { label: string; value: number }[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="py-3 text-[13px] text-muted">{empty}</p>;
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li key={r.label} className="relative overflow-hidden rounded-md">
          <span className="absolute inset-y-0 left-0 rounded-md bg-purple-soft" style={{ width: `${(r.value / max) * 100}%` }} aria-hidden />
          <span className="relative flex items-center justify-between gap-3 px-2.5 py-1.5 text-[13px]"><span className="min-w-0 truncate font-medium">{r.label}</span><b className="tabular-nums">{nf.format(r.value)}</b></span>
        </li>
      ))}
    </ul>
  );
}

export function AnalyticsLive({ initial }: { initial: SiteAnalytics | null }) {
  const [period, setPeriod] = useState<Period>("24h");
  const [data, setData] = useState<SiteAnalytics | null>(initial);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [ignoreMine, setIgnoreMine] = useState(false);
  const alive = useRef(true);

  const load = useCallback(async (p: Period) => {
    try {
      const res = await fetch(`/api/admin/analytics?period=${p}`, { cache: "no-store" });
      if (!res.ok) throw new Error("fetch");
      const json = (await res.json()) as SiteAnalytics;
      if (alive.current) { setData(json); setError(false); setNow(Date.now()); }
    } catch { if (alive.current) setError(true); }
  }, []);

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    // Opening this page once on a computer turns its own visits off by default; "ef-no-track-choice" remembers an explicit choice to count them.
    try {
      if (!localStorage.getItem("ef-no-track-choice") && !localStorage.getItem("ef-no-track")) localStorage.setItem("ef-no-track", "1");
      setIgnoreMine(Boolean(localStorage.getItem("ef-no-track")));
    } catch { /* storage unavailable */ }
  }, []);
  useEffect(() => { void load(period); }, [period, load]);
  useEffect(() => {
    const id = setInterval(() => { if (document.visibilityState === "visible") void load(period); }, 10_000);
    return () => clearInterval(id);
  }, [period, load]);

  const daily = period !== "24h";
  const fmtLabel = useMemo(() => {
    const f = daily ? new Intl.DateTimeFormat("ro-RO", { day: "2-digit", month: "2-digit", timeZone: "Europe/Bucharest" }) : new Intl.DateTimeFormat("ro-RO", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" });
    return (iso: string) => f.format(new Date(iso));
  }, [daily]);

  function toggleIgnore() {
    try {
      localStorage.setItem("ef-no-track-choice", "1");
      if (ignoreMine) localStorage.removeItem("ef-no-track"); else localStorage.setItem("ef-no-track", "1");
      setIgnoreMine(!ignoreMine);
    } catch { /* storage unavailable */ }
  }

  const dv = data ? delta(data.visitors, data.prev_visitors) : null;
  const dp = data ? delta(data.views, data.prev_views) : null;
  const total = data?.devices.reduce((a, d) => a + d.visitors, 0) ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Analitice site</h1>
          <p className="text-sm text-muted">Vizitele pe electrofield.ro: prima pagină, blog, programări, termeni. Fără cookie-uri, fără adrese IP salvate. Datele se actualizează singure la 10 secunde.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3.5 py-1.5 text-[13px] font-bold" role="status">
            <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" /></span>
            {data ? `${data.online} ${data.online === 1 ? "vizitator online" : "vizitatori online"}` : "Se încarcă…"}
          </span>
          <select aria-label="Perioadă" value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="rounded-lg border border-border bg-white p-2 text-[13px] font-semibold">
            {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg bg-danger-bg p-3 text-sm text-danger">Nu am putut actualiza datele. Mai încerc automat.</p>}

      {!data ? <p className="text-muted">Se încarcă analiticele…</p> : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Vizitatori", value: nf.format(data.visitors), d: dv },
              { label: "Afișări de pagină", value: nf.format(data.views), d: dp },
              { label: "Rată de respingere", value: data.bounce == null ? "—" : `${data.bounce}%`, d: null },
            ].map((k) => (
              <div key={k.label} className="rounded-2xl border border-border bg-white px-5 py-4">
                <div className="text-[12.5px] font-semibold text-muted">{k.label}</div>
                <div className="mt-1 flex items-baseline gap-2"><span className="text-[30px] font-extrabold leading-none tabular-nums">{k.value}</span>
                  {k.d && <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-bold ${k.d.up ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}>{k.d.text}</span>}</div>
                <div className="mt-1 text-[11.5px] text-muted">{k.d ? "față de perioada anterioară" : "vizitatori care au văzut o singură pagină"}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-white p-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h2 className="text-[15px] font-bold">Vizitatori {daily ? "pe zile" : "pe ore"}</h2><span className="text-[12px] text-muted">oră locală România</span></div>
            <Area points={data.series.map((s) => s.visitors)} labels={data.series.map((s) => fmtLabel(s.t))} daily={daily} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white p-5"><h2 className="mb-3 text-[15px] font-bold">Pagini</h2>
              <Bars rows={data.pages.map((p) => ({ label: p.path, value: p.visitors }))} empty="Nicio vizită în această perioadă." /></div>
            <div className="rounded-2xl border border-border bg-white p-5"><h2 className="mb-3 text-[15px] font-bold">De unde vin</h2>
              <Bars rows={data.referrers.map((r) => ({ label: r.name, value: r.visitors }))} empty="Nicio vizită în această perioadă." />
              {data.sources.length > 0 && <><h3 className="mb-2 mt-4 text-[12.5px] font-bold uppercase tracking-wide text-muted">Campanii (utm_source)</h3><Bars rows={data.sources.map((r) => ({ label: r.name, value: r.visitors }))} empty="" /></>}</div>
            <div className="rounded-2xl border border-border bg-white p-5"><h2 className="mb-3 text-[15px] font-bold">Țări</h2>
              <Bars rows={data.countries.map((c) => ({ label: country(c.code), value: c.visitors }))} empty="Nicio vizită în această perioadă." /></div>
            <div className="rounded-2xl border border-border bg-white p-5"><h2 className="mb-3 text-[15px] font-bold">Dispozitive</h2>
              <Bars rows={data.devices.map((d) => ({ label: `${DEVICE[d.name] ?? d.name}${total ? ` · ${Math.round((d.visitors / total) * 100)}%` : ""}`, value: d.visitors }))} empty="Nicio vizită în această perioadă." /></div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="text-[15px] font-bold">Live · ultimele 30 de minute</h2><span className="text-[12px] text-muted">{data.last30.reduce((a, m) => a + m.views, 0)} afișări</span></div>
            <Spark values={data.last30.map((m) => m.views)} />
            <ul className="mt-4 divide-y divide-[#eef0f4]" aria-label="Ultimele vizite">
              {data.recent.length === 0 && <li className="py-3 text-[13px] text-muted">Nicio vizită încă. Deschide electrofield.ro într-o fereastră nouă și apare aici în câteva secunde.</li>}
              {data.recent.map((r, i) => (
                <li key={`${r.t}-${i}`} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[13px]">
                  <span className="min-w-0 truncate"><b>{r.path}</b> <span className="text-muted">· {country(r.country)} · {DEVICE[r.device] ?? r.device}{r.referrer_host ? ` · de la ${r.referrer_host}` : ""}</span></span>
                  <span className="shrink-0 text-[12px] text-muted tabular-nums">{ago(r.t, now)}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <label className="flex items-center gap-2 text-[13px] text-muted"><input type="checkbox" checked={ignoreMine} onChange={toggleIgnore} className="h-4 w-4" /> Nu număra vizitele de pe acest browser (se activează singur când deschizi această pagină; fă-o o dată în fiecare browser pe care îl folosești)</label>
    </div>
  );
}
