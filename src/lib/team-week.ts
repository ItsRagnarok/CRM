export type WeekJob = {
  id: string; display_number: number; title: string; status: string; domain: string | null;
  scheduled_date: string; start_time: string | null; end_time: string | null; team_id: string | null;
  clients: { name: string } | null; assignees: { id: string; name: string }[];
};

const minutes = (t: string | null) => (t ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) : null);

export function jobHours(j: Pick<WeekJob, "start_time" | "end_time">) {
  const a = minutes(j.start_time), b = minutes(j.end_time);
  return a !== null && b !== null && b > a ? (b - a) / 60 : 0;
}

/** A technician is double-booked when two jobs on the same day overlap, or when both have no times. */
export function findConflicts(jobs: WeekJob[]): Set<string> {
  const out = new Set<string>();
  const byPersonDay = new Map<string, WeekJob[]>();
  for (const j of jobs) {
    if (j.status === "anulata") continue;
    for (const p of j.assignees) {
      const key = `${p.id}|${j.scheduled_date}`;
      byPersonDay.set(key, [...(byPersonDay.get(key) ?? []), j]);
    }
  }
  for (const list of byPersonDay.values()) {
    for (let i = 0; i < list.length; i++) {
      for (let k = i + 1; k < list.length; k++) {
        const a = list[i], b = list[k];
        const [as, ae, bs, be] = [minutes(a.start_time), minutes(a.end_time), minutes(b.start_time), minutes(b.end_time)];
        const overlap = as === null || bs === null || ae === null || be === null ? true : as < be && bs < ae;
        if (overlap) { out.add(a.id); out.add(b.id); }
      }
    }
  }
  return out;
}
