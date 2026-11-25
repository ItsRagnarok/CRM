/**
 * Cât durează de obicei fiecare tip de lucrare, calculat din pontajul lucrărilor finalizate
 * (de la primul „Pornește lucrul” la ultimul „Termină lucrul”). Fără AI: mediană și interval.
 * Funcții pure (fără importuri), testate în scripts/job-durations.test.mjs.
 */

export type DurationSample = { title: string; plannedMin: number | null; actualMin: number };
export type DurationStat = {
  key: string;
  label: string;
  count: number;
  medianMin: number;
  lowMin: number; // percentila 25
  highMin: number; // percentila 75
  plannedMedianMin: number | null;
};

/** Lucrări mai scurte de 10 minute sau mai lungi de 16 ore sunt aproape sigur pontaj uitat deschis. */
export const MIN_SAMPLE_MIN = 10;
export const MAX_SAMPLE_MIN = 16 * 60;
/** Sub atâtea lucrări nu dăm o estimare, doar „puține date”. */
export const MIN_COUNT = 3;

/** „Montaj sistem fotovoltaic — Familia Rusu (casă)” → „montaj sistem fotovoltaic”. */
export function jobKind(title: string): string {
  return title
    .split(/\s[—–-]\s/)[0]
    .replace(/#\d+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("ro-RO");
}

function quantile(sorted: number[], q: number) {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

const roundTo5 = (m: number) => Math.round(m / 5) * 5;

export function durationStats(samples: DurationSample[]): DurationStat[] {
  const groups = new Map<string, { labels: Map<string, number>; actual: number[]; planned: number[] }>();
  for (const s of samples) {
    if (!(s.actualMin >= MIN_SAMPLE_MIN && s.actualMin <= MAX_SAMPLE_MIN)) continue;
    const key = jobKind(s.title);
    if (!key) continue;
    const g = groups.get(key) ?? { labels: new Map<string, number>(), actual: [] as number[], planned: [] as number[] };
    const label = s.title.split(/\s[—–-]\s/)[0].trim();
    g.labels.set(label, (g.labels.get(label) ?? 0) + 1);
    g.actual.push(s.actualMin);
    if (s.plannedMin && s.plannedMin > 0) g.planned.push(s.plannedMin);
    groups.set(key, g);
  }
  const out: DurationStat[] = [];
  for (const [key, g] of groups) {
    const a = [...g.actual].sort((x, y) => x - y);
    const p = [...g.planned].sort((x, y) => x - y);
    out.push({
      key,
      label: [...g.labels.entries()].sort((x, y) => y[1] - x[1])[0][0],
      count: a.length,
      medianMin: roundTo5(quantile(a, 0.5)),
      lowMin: roundTo5(quantile(a, 0.25)),
      highMin: roundTo5(quantile(a, 0.75)),
      plannedMedianMin: p.length ? roundTo5(quantile(p, 0.5)) : null,
    });
  }
  return out.sort((x, y) => y.count - x.count || x.label.localeCompare(y.label, "ro"));
}

/** Estimarea pentru un titlu nou, doar dacă avem destule lucrări de același tip. */
export function estimateFor(title: string, stats: DurationStat[]): DurationStat | null {
  const key = jobKind(title);
  if (!key) return null;
  const hit = stats.find((s) => s.key === key);
  return hit && hit.count >= MIN_COUNT ? hit : null;
}

export function formatMinutes(min: number): string {
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60), r = m % 60;
  if (!h) return `${r} min`;
  return r ? `${h} h ${r} min` : `${h} h`;
}

/** „09:30” + 200 min → „12:50”; null dacă trece de miezul nopții. */
export function addMinutes(hhmm: string, min: number): string | null {
  if (!/^\d{2}:\d{2}/.test(hhmm)) return null;
  const total = Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5)) + Math.round(min);
  if (total >= 24 * 60) return null;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Cum se compară ce planifică biroul cu ce durează de fapt (doar diferențe de peste 30 min și 20%). */
export function planningGap(stat: DurationStat): { kind: "under" | "over"; diffMin: number } | null {
  if (stat.plannedMedianMin == null || stat.count < MIN_COUNT) return null;
  const diff = stat.medianMin - stat.plannedMedianMin;
  if (Math.abs(diff) < 30 || Math.abs(diff) < stat.plannedMedianMin * 0.2) return null;
  return { kind: diff > 0 ? "under" : "over", diffMin: Math.abs(diff) };
}

type Entry = { job_id: string; event_type: string; occurred_at: string };

/**
 * Durata reală a unei lucrări, pe ceas: de la primul work_start la ultimul work_end (doi tehnicieni
 * pe aceeași lucrare nu dublează durata). Fără pontaj, se folosesc orele salvate pe lucrare.
 */
export function actualMinutes(entries: Entry[], fallback: { start: string | null; end: string | null }): number | null {
  const starts = entries.filter((e) => e.event_type === "work_start").map((e) => Date.parse(e.occurred_at));
  const ends = entries.filter((e) => e.event_type === "work_end").map((e) => Date.parse(e.occurred_at));
  let a: number | null = null, b: number | null = null;
  if (starts.length && ends.length) {
    a = Math.min(...starts);
    b = Math.max(...ends);
  } else if (fallback.start && fallback.end) {
    a = Date.parse(fallback.start);
    b = Date.parse(fallback.end);
  }
  if (a == null || b == null || !Number.isFinite(a) || !Number.isFinite(b) || b <= a) return null;
  return (b - a) / 60000;
}

export function plannedMinutes(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const s = Number(start.slice(0, 2)) * 60 + Number(start.slice(3, 5));
  const e = Number(end.slice(0, 2)) * 60 + Number(end.slice(3, 5));
  return e > s ? e - s : null;
}
