"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";

/** Moves a job to a different day by dragging its card on the calendar grid. */
export async function rescheduleJob(jobId: string, scheduledDate: string) {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("jobs")
    .update({ scheduled_date: scheduledDate })
    .eq("id", jobId)
    .eq("organization_id", organization.id);

  if (error) return { error: "Nu am putut muta lucrarea." };

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath(`/lucrari/${jobId}`);
  return { error: null };
}
