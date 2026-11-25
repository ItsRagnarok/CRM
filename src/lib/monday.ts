// Ecranul „Luni dimineața”: catalogul de cifre din care patronul alege 3, pragurile și regula de alertă.
// Regula de prag e aceeași ca în baza de date (ef_monday_breaches), care trimite notificarea de luni.

export type Bucket = { label: string; amount: number; count: number };
export type Group = { key: string; jobs: number; billed: number; cost: number };
export type MondayReport = {
  today: string;
  restante: {
    total: number; count: number; over60: number; not_due: number; not_due_count: number;
    buckets: Bucket[];
    clients: { id: string; name: string; phone: string | null; amount: number; oldest: number; count: number }[];
  };
  nefacturat: { count: number; estimate: number; oldest: number };
  incasat: { last7: number; prev7: number };
  facturat: { last30: number; prev30: number };
  marja: { billed: number; cost: number; jobs: number; missing: number; by_type: Group[]; by_team: Group[] };
  cereri: { count: number; old: number };
  saptamana: { jobs: number; no_team: number };
};

export const METRIC_IDS = ["restante", "restante60", "nefacturat", "incasat", "facturat", "marja", "cereri", "saptamana"] as const;
export type MetricId = (typeof METRIC_IDS)[number];
export type MondayConfig = { metrics: MetricId[]; thresholds: Partial<Record<MetricId, number>> };

type Unit = "lei" | "%" | "lucrări" | "cereri";
export type MetricDef = {
  label: string;
  short: string;
  unit: Unit;
  /** „above”: alertă când valoarea trece peste prag; „below”: când scade sub prag. */
  dir: "above" | "below";
  value: (r: MondayReport) => number | null;
  sub: (r: MondayReport) => string;
  action: string;
  href: string;
  hrefLabel: string;
};

export const lei = (n: number) => `${Math.round(n).toLocaleString("ro-RO")} lei`;
const count = (n: number, one: string, many: string) => `${n.toLocaleString("ro-RO")} ${n === 1 ? one : many}`;
export const marginPct = (billed: number, cost: number) => (billed > 0 ? Math.round((100 * (billed - cost)) / billed) : null);
const change = (now: number, before: number, period: string) => {
  if (!before) return now ? `${period} anterioară: 0` : `nimic nici în ${period.toLowerCase()} anterioară`;
  const pct = Math.round((100 * (now - before)) / before);
  return `${pct >= 0 ? "+" : "−"}${Math.abs(pct)}% față de ${period.toLowerCase()} anterioară (${lei(before)})`;
};

export const METRICS: Record<MetricId, MetricDef> = {
  restante: {
    label: "Restanțe", short: "Restanțe", unit: "lei", dir: "above",
    value: (r) => r.restante.total,
    sub: (r) => (r.restante.count ? `${count(r.restante.count, "factură trecută", "facturi trecute")} de scadență` : "Nicio factură trecută de scadență"),
    action: "Sună clienții de mai jos, începând cu restanța cea mai veche.",
    href: "#restante", hrefLabel: "Vezi pe cine suni",
  },
  restante60: {
    label: "Restanțe peste 60 de zile", short: "Restanțe 60+", unit: "lei", dir: "above",
    value: (r) => r.restante.over60,
    sub: (r) => `din ${lei(r.restante.total)} restanțe în total`,
    action: "Peste 60 de zile e semn de criză de bani: cere plata în scris și oprește lucrările noi pentru clientul respectiv.",
    href: "#restante", hrefLabel: "Vezi clienții",
  },
  nefacturat: {
    label: "Lucrări terminate, nefacturate", short: "Nefacturate", unit: "lucrări", dir: "above",
    value: (r) => r.nefacturat.count,
    sub: (r) => (r.nefacturat.count ? `~${lei(r.nefacturat.estimate)} (estimare din ore și materiale) · cea mai veche de ${count(r.nefacturat.oldest, "zi", "zile")}` : "Totul e facturat"),
    action: "Facturează lucrările terminate: fiecare zi de întârziere amână încasarea.",
    href: "/facturare", hrefLabel: "Facturează",
  },
  incasat: {
    label: "Încasat în ultimele 7 zile", short: "Încasat 7 zile", unit: "lei", dir: "below",
    value: (r) => r.incasat.last7,
    sub: (r) => change(r.incasat.last7, r.incasat.prev7, "Săptămâna"),
    action: "Încasări mici: uită-te la restanțe și sună clienții cu facturi trecute de scadență.",
    href: "#restante", hrefLabel: "Vezi restanțele",
  },
  facturat: {
    label: "Facturat în ultimele 30 de zile", short: "Facturat 30 zile", unit: "lei", dir: "below",
    value: (r) => r.facturat.last30,
    sub: (r) => change(r.facturat.last30, r.facturat.prev30, "Luna"),
    action: "Facturare sub țintă: verifică lucrările nefacturate și calendarul pentru zilele goale.",
    href: "/facturare", hrefLabel: "Facturare",
  },
  marja: {
    label: "Marja lucrărilor facturate (90 de zile)", short: "Marjă", unit: "%", dir: "below",
    value: (r) => marginPct(r.marja.billed, r.marja.cost),
    sub: (r) => (r.marja.jobs ? `${lei(r.marja.billed - r.marja.cost)} din ${lei(r.marja.billed)} facturat · ${count(r.marja.jobs, "lucrare", "lucrări")}` : "Încă nu sunt lucrări facturate cu ore pe teren"),
    action: "Marjă sub prag: vezi mai jos ce tip de lucrare sau ce echipă o trage în jos și revezi prețul întâi.",
    href: "#marja", hrefLabel: "Vezi pe tip și echipă",
  },
  cereri: {
    label: "Cereri fără răspuns de peste 24 h", short: "Cereri vechi", unit: "cereri", dir: "above",
    value: (r) => r.cereri.old,
    sub: (r) => `${count(r.cereri.count, "cerere nouă", "cereri noi")} în total`,
    action: "Un client care nu e sunat în prima zi sună la altă firmă.",
    href: "/cereri", hrefLabel: "Cereri noi",
  },
  saptamana: {
    label: "Lucrări fără echipă săptămâna asta", short: "Fără echipă", unit: "lucrări", dir: "above",
    value: (r) => r.saptamana.no_team,
    sub: (r) => `${count(r.saptamana.jobs, "lucrare", "lucrări")} în calendar săptămâna asta`,
    action: "Alocă echipe lucrărilor programate, ca să nu afli dimineața că nu merge nimeni.",
    href: "/calendar", hrefLabel: "Calendar",
  },
};

export const DEFAULT_CONFIG: MondayConfig = {
  metrics: ["restante", "marja", "nefacturat"],
  thresholds: { restante: 10000, restante60: 0, nefacturat: 3, marja: 30, cereri: 0, saptamana: 0 },
};

/** Citește configurația salvată; fără ea, alegerea implicită. Aceeași regulă ca în baza de date. */
export function parseConfig(raw: unknown): MondayConfig {
  const o = (raw && typeof raw === "object" ? raw : {}) as { metrics?: unknown; thresholds?: unknown };
  const metrics = Array.isArray(o.metrics) ? o.metrics.filter((m): m is MetricId => METRIC_IDS.includes(m as MetricId)) : null;
  const th = o.thresholds && typeof o.thresholds === "object" ? (o.thresholds as Record<string, unknown>) : null;
  const thresholds: MondayConfig["thresholds"] = {};
  if (th) for (const id of METRIC_IDS) if (typeof th[id] === "number" && Number.isFinite(th[id])) thresholds[id] = th[id] as number;
  return {
    metrics: metrics && metrics.length ? [...new Set(metrics)].slice(0, 3) : DEFAULT_CONFIG.metrics,
    thresholds: th ? thresholds : DEFAULT_CONFIG.thresholds,
  };
}

export type MetricState = "peste" | "ok" | "fara_prag" | "fara_date";
export function metricState(id: MetricId, r: MondayReport, cfg: MondayConfig): MetricState {
  const v = METRICS[id].value(r);
  if (v === null) return "fara_date";
  const t = cfg.thresholds[id];
  if (t === undefined) return "fara_prag";
  return (METRICS[id].dir === "above" ? v > t : v < t) ? "peste" : "ok";
}

export function formatValue(id: MetricId, v: number | null) {
  if (v === null) return "—";
  const unit = METRICS[id].unit;
  if (unit === "lei") return lei(v);
  if (unit === "%") return `${v}%`;
  return v.toLocaleString("ro-RO");
}

export function thresholdText(id: MetricId, t: number | undefined) {
  if (t === undefined) return "Fără prag";
  const d = METRICS[id];
  const v = d.unit === "lei" ? lei(t) : d.unit === "%" ? `${t}%` : `${t.toLocaleString("ro-RO")} ${d.unit}`;
  return `Alertă ${d.dir === "above" ? "peste" : "sub"} ${v}`;
}
