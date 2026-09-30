"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";
import { sendPushToProfiles } from "@/lib/push";

export async function resolveJobAlert(formData: FormData) {
  const alertId = String(formData.get("alertId") ?? "");
  if (!alertId) return;

  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  await supabase
    .from("job_alerts")
    .update({ resolved_at: new Date().toISOString() })
    .eq("id", alertId)
    .eq("organization_id", organization.id);

  revalidatePath("/harta");
  revalidatePath("/dashboard");
}

// There's no in-app calling infrastructure (that would need a third-party
// telephony/WebRTC service and its own setup) — this sends a push-style
// in-app notification asking the technician to call the admin back, which
// they'll see immediately in the mobile app's notification bell.
export async function requestCallFromTeam(formData: FormData) {
  const teamId = String(formData.get("teamId") ?? "");
  const jobId = String(formData.get("jobId") ?? "") || null;
  if (!teamId) return;

  const { organization, profile } = await requireSessionContext();
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("team_members")
    .select("profile_id")
    .eq("team_id", teamId);

  const recipients = (members ?? []).map((m) => m.profile_id);
  if (recipients.length === 0) return;

  const title = "Sună administratorul";
  const body = `${profile.full_name} te roagă să suni cât mai curând.`;

  await supabase.from("notifications").insert(
    recipients.map((profileId) => ({
      organization_id: organization.id,
      profile_id: profileId,
      type: "call_request",
      title,
      body,
      related_job_id: jobId,
    }))
  );
  await sendPushToProfiles(supabase, recipients, { title, body, data: jobId ? { jobId } : undefined });

  revalidatePath("/harta");
}
