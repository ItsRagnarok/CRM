"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { pageName } from "@/lib/site-pages";

export type SiteAnalytics = {
  online: number; last30: { t: string; views: number }[];
  visitors: number; views: number; bounce: number | null; prev_visitors: number; prev_views: number; daily: boolean; from: string; to: string;
  series: { t: string; views: number; visitors: number }[];
  pages: { path: string; visitors: number; views: number; avg_seconds?: number | null }[];
  referrers: { name: string; visitors: number }[]; sources: { name: string; visitors: number }[];
  countries: { code: string; visitors: number }[]; devices: { name: string; visitors: number }[];
  recent: { t: string; path: string; country: string | null; region?: string | null; city?: string | null; device: string; referrer_host: string | null; kind?: string }[];
  avg_seconds?: number | null; leads_count?: number;
  entries?: { path: string; visitors: number }[];
  channels?: { name: string; visitors: number; leads: number }[];
  regions?: { country: string | null; region: string; visitors: number }[];
  cities?: { country: string | null; region: string | null; city: string; visitors: number }[];
  journeys?: Journey[];
  systems?: { name: string; visitors: number }[];
  models?: { name: string; visitors: number }[];
  browsers?: { name: string; visitors: number }[];
};
type Step = { p: string; s: number | null; t: string };
type Journey = { first_at: string; last_at: string; entry: string; channel: string; country: string | null; region: string | null; city: string | null; device: string; os?: string | null; browser?: string | null; model?: string | null; screen?: string | null; pages: number; seconds: number; trail: string[]; steps?: Step[]; lead: boolean };

// Județele României după codul ISO 3166-2 (Vercel trimite partea de după „RO-”).
const JUDETE: Record<string, string> = {
  AB: "Alba", AR: "Arad", AG: "Argeș", BC: "Bacău", BH: "Bihor", BN: "Bistrița-Năsăud", BT: "Botoșani", BV: "Brașov", BR: "Brăila", B: "București",
  BZ: "Buzău", CS: "Caraș-Severin", CL: "Călărași", CJ: "Cluj", CT: "Constanța", CV: "Covasna", DB: "Dâmbovița", DJ: "Dolj", GL: "Galați", GR: "Giurgiu",
  GJ: "Gorj", HR: "Harghita", HD: "Hunedoara", IL: "Ialomița", IS: "Iași", IF: "Ilfov", MM: "Maramureș", MH: "Mehedinți", MS: "Mureș", NT: "Neamț",
  OT: "Olt", PH: "Prahova", SM: "Satu Mare", SJ: "Sălaj", SB: "Sibiu", SV: "Suceava", TR: "Teleorman", TM: "Timiș", TL: "Tulcea", VS: "Vaslui", VL: "Vâlcea", VN: "Vrancea",
};
const regionName = (c: string | null | undefined, r: string | null | undefined) => (!r ? "" : c === "RO" ? (JUDETE[r] ?? r) : `${r}, ${c ?? "?"}`);
// Vercel trimite orașele în engleză sau fără diacritice; le afișăm cum le scriem noi.
const ORASE: Record<string, string> = {
  bucharest: "București", bucuresti: "București", timisoara: "Timișoara", "targu mures": "Târgu Mureș", "targu-mures": "Târgu Mureș", constanta: "Constanța",
  iasi: "Iași", brasov: "Brașov", galati: "Galați", ploiesti: "Ploiești", pitesti: "Pitești", braila: "Brăila", bacau: "Bacău", "ramnicu valcea": "Râmnicu Vâlcea",
  "piatra neamt": "Piatra Neamț", buzau: "Buzău", botosani: "Botoșani", focsani: "Focșani", "targu jiu": "Târgu Jiu", calarasi: "Călărași", slatina: "Slatina",
  resita: "Reșița", "drobeta-turnu severin": "Drobeta-Turnu Severin", "satu mare": "Satu Mare", "baia mare": "Baia Mare", "sfantu gheorghe": "Sfântu Gheorghe",
  "miercurea ciuc": "Miercurea Ciuc", "alba iulia": "Alba Iulia", bistrita: "Bistrița", targoviste: "Târgoviște", "medias": "Mediaș", "sighisoara": "Sighișoara",
  "voluntari": "Voluntari", otopeni: "Otopeni", "popesti-leordeni": "Popești-Leordeni", "chiajna": "Chiajna", "floresti": "Florești",
};
const cityName = (c: string | null | undefined) => (c ? ORASE[c.trim().toLowerCase()] ?? c : "");
const place = (v: { country?: string | null; region?: string | null; city?: string | null }) =>
  [cityName(v.city), v.country === "RO" ? (v.region ? (v.region === "B" ? "" : `jud. ${JUDETE[v.region] ?? v.region}`) : "") : regionName(v.country, v.region), v.country !== "RO" ? country(v.country ?? null) : ""].filter(Boolean).join(", ") || country(v.country ?? null);
const dur = (s: number | null | undefined) => (!s ? "—" : s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s`);
type Period = "24h" | "today" | "yesterday" | "7d" | "30d" | "custom";
const PERIODS: { id: Period; label: string }[] = [
  { id: "24h", label: "Ultimele 24 de ore" }, { id: "today", label: "Astăzi" }, { id: "yesterday", label: "Ieri" },
  { id: "7d", label: "Ultimele 7 zile" }, { id: "30d", label: "Ultimele 30 de zile" }, { id: "custom", label: "Interval personalizat…" },
];
const dayIso = (d: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Bucharest" }).format(d);
const DEVICE: Record<string, string> = { desktop: "Calculator", mobile: "Telefon", tablet: "Tabletă" };
const nf = new Intl.NumberFormat("ro-RO");
const hhmm = (iso: string) => new Intl.DateTimeFormat("ro-RO", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" }).format(new Date(iso));
/** „Campanie: dmo-energy” înseamnă că a intrat pe un link marcat de noi (ex. din mesajul trimis unui lead). */
const channelName = (c: string) => (c.startsWith("Campanie: ") ? `Link marcat · ${c.slice(10)}` : c === "Direct" ? "Direct (a scris adresa sau link fără sursă)" : c);
const deviceLine = (j: { device: string; model?: string | null; os?: string | null; browser?: string | null; screen?: string | null }) =>
  [j.model && j.model !== "Calculator" ? j.model : DEVICE[j.device] ?? j.device, j.os, j.browser, j.screen ? `ecran ${j.screen.replace("x", "×")}` : null].filter(Boolean).join(" · ");

function JourneyCard({ j }: { j: Journey }) {
  const steps: Step[] = j.steps ?? j.trail.map((p) => ({ p, s: null, t: j.first_at }));
  return (
    <li className={`rounded-xl border p-3.5 ${j.lead ? "border-success/40 bg-success-bg" : "border-[#eef0f4]"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[14px] font-bold">{place(j)}</div>
          <div className="text-[12px] text-muted">{deviceLine(j)}</div>
        </div>
        <div className="text-right text-[12px] tabular-nums text-muted">
          {hhmm(j.first_at)}{j.last_at && hhmm(j.last_at) !== hhmm(j.first_at) ? `–${hhmm(j.last_at)}` : ""} · {dur(j.seconds)} · {j.pages} {j.pages === 1 ? "pagină" : "pagini"}
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px]">
        <span className="rounded-full bg-purple-soft px-2 py-0.5 font-semibold">{channelName(j.channel)}</span>
        {j.lead && <span className="rounded-full bg-success px-2 py-0.5 font-bold text-white">A trimis cerere de programare</span>}
      </div>
      <ol className="mt-2.5 border-l-2 border-[#e4e7ec] pl-3">
        {steps.map((st, k) => (
          <li key={k} className="relative flex items-baseline gap-2 py-0.5 text-[13px]">
            <span className="absolute -left-[17px] top-[9px] h-2 w-2 rounded-full bg-purple" aria-hidden />
            <span className="w-11 shrink-0 tabular-nums text-[11.5px] text-muted">{hhmm(st.t)}</span>
            <span className="min-w-0 flex-1">{pageName(st.p)}</span>
            <span className="shrink-0 tabular-nums text-[11.5px] text-muted">{st.s ? dur(st.s) : ""}</span>
          </li>
        ))}
        {j.pages > steps.length && <li className="py-0.5 text-[12px] text-muted">+{j.pages - steps.length} pagini</li>}
      </ol>
    </li>
  );
}

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
  const [error, setError] = useState("");
  const [from, setFrom] = useState(() => dayIso(new Date(Date.now() - 6 * 86_400_000)));
  const [to, setTo] = useState(() => dayIso(new Date()));
  const [range, setRange] = useState({ from: "", to: "" });
  const [now, setNow] = useState(() => Date.now());
  const [ignoreMine, setIgnoreMine] = useState(false);
  const alive = useRef(true);

  const load = useCallback(async (p: Period, r: { from: string; to: string }) => {
    if (p === "custom" && !(r.from && r.to)) return;
    try {
      const res = await fetch(`/api/admin/analytics?period=${p}${p === "custom" ? `&from=${r.from}&to=${r.to}` : ""}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(typeof json?.error === "string" ? json.error : "fetch");
      if (alive.current) { setData(json as SiteAnalytics); setError(""); setNow(Date.now()); }
    } catch (e) { if (alive.current) setError(e instanceof Error && e.message !== "fetch" && e.message !== "Failed to fetch" ? e.message : "Nu am putut actualiza datele. Mai încerc automat."); }
  }, []);

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    // Opening this page once on a computer turns its own visits off by default; "ef-no-track-choice" remembers an explicit choice to count them.
    try {
      if (!localStorage.getItem("ef-no-track-choice") && !localStorage.getItem("ef-no-track")) localStorage.setItem("ef-no-track", "1");
      setIgnoreMine(Boolean(localStorage.getItem("ef-no-track")));
    } catch { /* storage unavailable */ }
  }, []);
  useEffect(() => { void load(period, range); }, [period, range, load]);
  useEffect(() => {
    const id = setInterval(() => { if (document.visibilityState === "visible") void load(period, range); }, 10_000);
    return () => clearInterval(id);
  }, [period, range, load]);

  const daily = data?.daily ?? false;
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
          <p className="text-sm text-muted">Vizitele pe electrofield.ro: de unde vin (sursă, județ, oraș), ce citesc, cât stau și cine cere programare. Fără cookie-uri, fără adrese IP salvate. Se actualizează singur la 10 secunde.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3.5 py-1.5 text-[13px] font-bold" role="status">
            <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" /></span>
            {data ? `${data.online} ${data.online === 1 ? "vizitator online" : "vizitatori online"}` : "Se încarcă…"}
          </span>
          <select aria-label="Perioadă" value={period} onChange={(e) => { const next = e.target.value as Period; setPeriod(next); if (next === "custom") setRange({ from, to }); }} className="rounded-lg border border-border bg-white p-2 text-[13px] font-semibold">
            {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          {period === "custom" && (
            <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); setRange({ from, to }); }}>
              <label className="sr-only" htmlFor="an-from">De la</label>
              <input id="an-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-border bg-white p-2 text-[13px]" required />
              <span className="text-[13px] text-muted">–</span>
              <label className="sr-only" htmlFor="an-to">Până la</label>
              <input id="an-to" type="date" value={to} min={from || undefined} max={dayIso(new Date())} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-border bg-white p-2 text-[13px]" required />
              <button className="rounded-lg bg-purple px-3.5 py-2 text-[13px] font-bold text-white">Aplică</button>
            </form>
          )}
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg bg-danger-bg p-3 text-sm text-danger">{error}</p>}

      {!data ? <p className="text-muted">Se încarcă analiticele…</p> : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Vizitatori", value: nf.format(data.visitors), d: dv, sub: "față de perioada anterioară" },
              { label: "Afișări de pagină", value: nf.format(data.views), d: dp, sub: "față de perioada anterioară" },
              { label: "Timp mediu pe vizită", value: dur(data.avg_seconds), d: null, sub: data.bounce == null ? "cât au stat pe site, în total" : `${data.bounce}% au văzut o singură pagină` },
              { label: "Cereri de programare", value: nf.format(data.leads_count ?? 0), d: null, sub: "trimise din pagina de programare" },
            ].map((k) => (
              <div key={k.label} className="rounded-2xl border border-border bg-white px-5 py-4">
                <div className="text-[12.5px] font-semibold text-muted">{k.label}</div>
                <div className="mt-1 flex items-baseline gap-2"><span className="text-[30px] font-extrabold leading-none tabular-nums">{k.value}</span>
                  {k.d && <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-bold ${k.d.up ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}>{k.d.text}</span>}</div>
                <div className="mt-1 text-[11.5px] text-muted">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-white p-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h2 className="text-[15px] font-bold">Vizitatori {daily ? "pe zile" : "pe ore"}</h2><span className="text-[12px] text-muted">{new Intl.DateTimeFormat("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Bucharest" }).format(new Date(data.from))} – {new Intl.DateTimeFormat("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Bucharest" }).format(new Date(data.to))} · oră locală România</span></div>
            <Area points={data.series.map((s) => s.visitors)} labels={data.series.map((s) => fmtLabel(s.t))} daily={daily} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white p-5"><h2 className="mb-1 text-[15px] font-bold">De unde vin</h2>
              <p className="mb-3 text-[12px] text-muted">Sursa primei pagini văzute de fiecare vizitator. „Link marcat” = a intrat pe un link etichetat de noi (ex. ?utm_source=dmo-energy din mesajul trimis lui DMO), deci știi exact de unde vine. „Direct” = a scris adresa, a folosit un semn de carte sau linkul nu spune de unde vine.</p>
              <Bars rows={(data.channels ?? []).map((c) => ({ label: `${channelName(c.name)}${c.leads ? ` · ${c.leads} ${c.leads === 1 ? "cerere" : "cereri"}` : ""}`, value: c.visitors }))} empty="Nicio vizită în această perioadă." /></div>
            <div className="rounded-2xl border border-border bg-white p-5"><h2 className="mb-1 text-[15px] font-bold">Județe și orașe</h2>
              <p className="mb-3 text-[12px] text-muted">Aproximativ, după rețeaua de internet a vizitatorului (pe date mobile poate apărea orașul operatorului).</p>
              <Bars rows={(data.regions ?? []).map((r) => ({ label: regionName(r.country, r.region), value: r.visitors }))} empty="Încă nu avem județe: apar pentru vizitele de acum înainte." />
              {(data.cities ?? []).length > 0 && <><h3 className="mb-2 mt-4 text-[12.5px] font-bold uppercase tracking-wide text-muted">Orașe</h3><Bars rows={(data.cities ?? []).map((c) => ({ label: place(c), value: c.visitors }))} empty="" /></>}</div>
            <div className="rounded-2xl border border-border bg-white p-5"><h2 className="mb-3 text-[15px] font-bold">Pagini</h2>
              <Bars rows={data.pages.map((p) => ({ label: `${pageName(p.path)}${p.avg_seconds ? ` · ${dur(p.avg_seconds)} în medie` : ""}`, value: p.visitors }))} empty="Nicio vizită în această perioadă." /></div>
            <div className="rounded-2xl border border-border bg-white p-5"><h2 className="mb-1 text-[15px] font-bold">Pagina pe care au intrat</h2>
              <p className="mb-3 text-[12px] text-muted">Prima pagină văzută: arată ce aduce oameni noi (de obicei articolele din blog).</p>
              <Bars rows={(data.entries ?? []).map((p) => ({ label: pageName(p.path), value: p.visitors }))} empty="Nicio vizită în această perioadă." /></div>
            <div className="rounded-2xl border border-border bg-white p-5"><h2 className="mb-3 text-[15px] font-bold">Site-uri care trimit vizitatori</h2>
              <Bars rows={data.referrers.map((r) => ({ label: r.name, value: r.visitors }))} empty="Nicio vizită în această perioadă." />
              {data.sources.length > 0 && <><h3 className="mb-2 mt-4 text-[12.5px] font-bold uppercase tracking-wide text-muted">Campanii (utm_source)</h3><Bars rows={data.sources.map((r) => ({ label: r.name, value: r.visitors }))} empty="" /></>}</div>
            <div className="rounded-2xl border border-border bg-white p-5"><h2 className="mb-3 text-[15px] font-bold">Țări</h2>
              <Bars rows={data.countries.map((c) => ({ label: country(c.code), value: c.visitors }))} empty="Nicio vizită în această perioadă." /></div>
            <div className="rounded-2xl border border-border bg-white p-5"><h2 className="mb-3 text-[15px] font-bold">Dispozitive</h2>
              <Bars rows={data.devices.map((d) => ({ label: `${DEVICE[d.name] ?? d.name}${total ? ` · ${Math.round((d.visitors / total) * 100)}%` : ""}`, value: d.visitors }))} empty="Nicio vizită în această perioadă." /></div>
            <div className="rounded-2xl border border-border bg-white p-5"><h2 className="mb-1 text-[15px] font-bold">Telefoane și sisteme</h2>
              <p className="mb-3 text-[12px] text-muted">Din datele trimise de browser. iPhone-urile nu își spun modelul exact; Chrome pe Android îl spune (ex. Samsung SM-S918B). Apar pentru vizitele de acum înainte.</p>
              <Bars rows={(data.models ?? []).map((m) => ({ label: m.name, value: m.visitors }))} empty="Încă nu avem date: apar pentru vizitele noi." />
              {(data.systems ?? []).length > 0 && <><h3 className="mb-2 mt-4 text-[12.5px] font-bold uppercase tracking-wide text-muted">Sistem</h3><Bars rows={(data.systems ?? []).map((m) => ({ label: m.name, value: m.visitors }))} empty="" /></>}
              {(data.browsers ?? []).length > 0 && <><h3 className="mb-2 mt-4 text-[12.5px] font-bold uppercase tracking-wide text-muted">Browser</h3><Bars rows={(data.browsers ?? []).map((m) => ({ label: m.name, value: m.visitors }))} empty="" /></>}</div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5">
            <h2 className="mb-1 text-[15px] font-bold">Drumul vizitatorilor</h2>
            <p className="mb-3 text-[12px] text-muted">Fiecare fișă e un vizitator (în aceeași zi): de unde a venit, de pe ce dispozitiv, ce pagini a deschis în ordine, la ce oră și cât a stat pe fiecare. Cine a trimis o cerere de programare apare primul, pe verde. Nu păstrăm nimic care să identifice persoana.</p>
            {(data.journeys ?? []).length === 0 ? <p className="py-3 text-[13px] text-muted">Nicio vizită în această perioadă.</p> : (
              <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">{(data.journeys ?? []).map((j, i) => <JourneyCard key={`${j.first_at}-${i}`} j={j} />)}</ul>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-white p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="text-[15px] font-bold">Live · ultimele 30 de minute</h2><span className="text-[12px] text-muted">{data.last30.reduce((a, m) => a + m.views, 0)} afișări</span></div>
            <Spark values={data.last30.map((m) => m.views)} />
            <ul className="mt-4 divide-y divide-[#eef0f4]" aria-label="Ultimele vizite">
              {data.recent.length === 0 && <li className="py-3 text-[13px] text-muted">Nicio vizită încă. Deschide electrofield.ro într-o fereastră nouă și apare aici în câteva secunde.</li>}
              {data.recent.map((r, i) => (
                <li key={`${r.t}-${i}`} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[13px]">
                  <span className="min-w-0 truncate">{r.kind === "lead" && <span className="mr-1.5 rounded-full bg-success px-2 py-0.5 text-[11px] font-bold text-white">Cerere de programare</span>}<b>{pageName(r.path)}</b> <span className="text-muted">· {place(r)} · {(r as { model?: string | null }).model && (r as { model?: string | null }).model !== "Calculator" ? (r as { model?: string | null }).model : DEVICE[r.device] ?? r.device}{r.referrer_host ? ` · de la ${r.referrer_host}` : ""}</span></span>
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
