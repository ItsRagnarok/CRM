import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// job_assignments (not jobs.team_id) is what the mobile app reads to decide
// what a technician has to do — so every place that sets a job's team must
// also sync this, or the job silently never appears on anyone's phone.
//
// The sync is a diff (insert what's missing, delete what's extra) instead of
// DELETE-then-INSERT, so a failure half-way can never leave a job with nobody
// assigned and a technician never loses the job for a moment on every edit.
export async function syncJobAssignmentsToTeam(supabase: Supabase, jobId: string, teamId: string | null) {
  const { data: current } = await supabase.from("job_assignments").select("profile_id").eq("job_id", jobId);
  const have = new Set((current ?? []).map((a) => a.profile_id));

  let want = new Set<string>();
  if (teamId) {
    const { data: members } = await supabase.from("team_members").select("profile_id").eq("team_id", teamId);
    want = new Set((members ?? []).map((m) => m.profile_id));
  }

  const toAdd = [...want].filter((id) => !have.has(id));
  const toRemove = [...have].filter((id) => !want.has(id));

  if (toAdd.length > 0) {
    await supabase.from("job_assignments").insert(toAdd.map((profile_id) => ({ job_id: jobId, profile_id })));
  }
  if (toRemove.length > 0) {
    await supabase.from("job_assignments").delete().eq("job_id", jobId).in("profile_id", toRemove);
  }
}

// When a technician joins or leaves a team, the team's open jobs must follow:
// otherwise the new member opens the app to an empty day and the one who left
// keeps seeing (and getting notified about) jobs that are no longer theirs.
export async function syncOpenJobsOfTeam(supabase: Supabase, organizationId: string, teamId: string) {
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("team_id", teamId)
    .not("status", "in", "(finalizata,anulata)");
  for (const job of jobs ?? []) {
    await syncJobAssignmentsToTeam(supabase, job.id, teamId);
  }
}
