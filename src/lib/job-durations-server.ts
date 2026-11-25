import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { actualMinutes, durationStats, plannedMinutes, type DurationSample, type DurationStat } from "@/lib/job-durations";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Duratele pe tip de lucrare din ultimele 12 luni de lucrări finalizate ale firmei. */
export async function loadDurationStats(supabase: Supabase, orgId: string): Promise<DurationStat[]> {
  const since = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, start_time, end_time, work_started_at, work_ended_at")
    .eq("organization_id", orgId)
    .eq("status", "finalizata")
    .gte("scheduled_date", since)
    .order("scheduled_date", { ascending: false })
    .limit(2000);
  if (!jobs?.length) return [];

  const ids = jobs.map((j) => j.id);
  const entries: { job_id: string; event_type: string; occurred_at: string }[] = [];
  for (let i = 0; i < ids.length; i += 300) {
    const { data } = await supabase
      .from("time_entries")
      .select("job_id, event_type, occurred_at")
      .eq("organization_id", orgId)
      .in("event_type", ["work_start", "work_end"])
      .in("job_id", ids.slice(i, i + 300));
    entries.push(...(data ?? []));
  }
  const byJob = new Map<string, typeof entries>();
  for (const e of entries) byJob.set(e.job_id, [...(byJob.get(e.job_id) ?? []), e]);

  const samples: DurationSample[] = [];
  for (const j of jobs) {
    const actual = actualMinutes(byJob.get(j.id) ?? [], { start: j.work_started_at, end: j.work_ended_at });
    if (actual == null) continue;
    samples.push({ title: j.title, plannedMin: plannedMinutes(j.start_time, j.end_time), actualMin: actual });
  }
  return durationStats(samples);
}
