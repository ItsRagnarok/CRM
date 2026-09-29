import type { createClient } from "@/lib/supabase/server";

// job_assignments (not jobs.team_id) is what the mobile app reads to decide
// what a technician has to do — so every place that sets a job's team must
// also sync this, or the job silently never appears on anyone's phone.
export async function syncJobAssignmentsToTeam(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string,
  teamId: string | null
) {
  await supabase.from("job_assignments").delete().eq("job_id", jobId);

  if (!teamId) return;

  const { data: members } = await supabase
    .from("team_members")
    .select("profile_id")
    .eq("team_id", teamId);

  if (!members || members.length === 0) return;

  await supabase.from("job_assignments").insert(
    members.map((m) => ({ job_id: jobId, profile_id: m.profile_id }))
  );
}
