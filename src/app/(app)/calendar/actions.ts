"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";
import { loadScheduleWarnings } from "@/lib/schedule-warnings-server";
import type { ScheduleWarning } from "@/lib/schedule-warnings";

/** Moves a job to a different day by dragging its card on the calendar grid. */
export async function rescheduleJob(jobId: string, scheduledDate: string): Promise<{ error: string | null; warnings: ScheduleWarning[]; label?: string }> {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .update({ scheduled_date: scheduledDate })
    .eq("id", jobId)
    .eq("organization_id", organization.id)
    .select("id, display_number, team_id, start_time, end_time, domain")
    .maybeSingle();

  if (error || !job) return { error: "Nu am putut muta lucrarea.", warnings: [] };

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath(`/lucrari/${jobId}`);

  // După mutare, spunem pe loc dacă noua zi are probleme (concediu, suprapunere, ITP...).
  const warnings = await loadScheduleWarnings(supabase, organization, {
    jobId: job.id,
    teamId: job.team_id,
    date: scheduledDate,
    start: job.start_time,
    end: job.end_time,
    domain: job.domain,
  });
  return { error: null, warnings, label: `#${job.display_number}` };
}
