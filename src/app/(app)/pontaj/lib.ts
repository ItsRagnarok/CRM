export type TimeEntry = { profile_id: string; job_id: string; event_type: string; occurred_at: string };

export function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function parseISODate(s: string) {
  return new Date(`${s}T00:00:00Z`);
}

export function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setUTCDate(c.getUTCDate() + n);
  return c;
}

export function startOfWeek(d: Date) {
  const day = d.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
  return addDays(d, diff);
}

// Sums the time between paired start/end events (e.g. work_start/work_end),
// matching each start to the next unmatched end. An unmatched trailing start
// (still in progress) is left open and not counted.
export function pairHours(events: TimeEntry[], startType: string, endType: string) {
  const sorted = [...events].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
  let total = 0;
  let openStart: number | null = null;
  for (const e of sorted) {
    const t = new Date(e.occurred_at).getTime();
    if (e.event_type === startType) {
      openStart = t;
    } else if (e.event_type === endType && openStart != null) {
      total += t - openStart;
      openStart = null;
    }
  }
  return total / 3_600_000;
}

export function formatHM(hours: number) {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  live: { label: "Activ acum", bg: "#DBEAFE", color: "#1D4ED8" },
  travel: { label: "În drum", bg: "#FEF3C7", color: "#B45309" },
  scheduled: { label: "Programat", bg: "#F2F4F7", color: "#475467" },
  available: { label: "Disponibil", bg: "#DCFCE7", color: "#15803D" },
};

const STATUS_PRIORITY: Record<string, number> = {
  in_lucru: 0,
  pauza: 0,
  in_drum: 1,
  ajunsa: 1,
  programata: 2,
};

export function bestTodayStatus(current: string | undefined, candidate: string) {
  const currentRank = current ? (STATUS_PRIORITY[current] ?? 3) : 4;
  const candidateRank = STATUS_PRIORITY[candidate] ?? 3;
  return candidateRank < currentRank ? candidate : current;
}

export function statusKind(status: string | undefined): keyof typeof STATUS_BADGE {
  if (!status) return "available";
  if (status === "in_lucru" || status === "pauza") return "live";
  if (status === "in_drum" || status === "ajunsa") return "travel";
  if (status === "programata") return "scheduled";
  return "available";
}

export type View = "zi" | "saptamana";

export function resolveRange(view: View, dateParam: string | undefined) {
  const todayStr = toISODate(new Date());
  const anchor = dateParam ? parseISODate(dateParam) : parseISODate(todayStr);
  const rangeStart = view === "zi" ? anchor : startOfWeek(anchor);
  const rangeEnd = view === "zi" ? anchor : addDays(rangeStart, 6);
  return {
    todayStr,
    anchor,
    rangeStart,
    rangeEnd,
    rangeStartStr: toISODate(rangeStart),
    rangeEndStr: toISODate(rangeEnd),
    rangeEndExclusiveStr: toISODate(addDays(rangeEnd, 1)),
  };
}
