"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";
import { notifyProfiles } from "@/lib/notify";

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

  // The person asking never needs to be told to call themselves (admins can
  // be team members too).
  const recipients = (members ?? []).map((m) => m.profile_id).filter((id) => id !== profile.id);
  if (recipients.length === 0) return;

  await notifyProfiles(supabase, {
    organizationId: organization.id,
    profileIds: recipients,
    type: "call_request",
    title: "Sună administratorul",
    body: `${profile.full_name} te roagă să suni cât mai curând.`,
    jobId,
    link: "/mobil",
  });

  revalidatePath("/harta");
}
