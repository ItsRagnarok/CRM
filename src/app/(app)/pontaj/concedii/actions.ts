"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";

export async function addTimeOff(formData: FormData) {
  const profileId = String(formData.get("profileId") ?? "");
  const type = String(formData.get("type") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (!profileId || !type || !startDate || !endDate) return;

  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  // An admin/manager recording a leave directly is the approval itself —
  // unlike a self-service request from the mobile app, which starts pending.
  await supabase.from("time_off_requests").insert({
    organization_id: organization.id,
    profile_id: profileId,
    type,
    start_date: startDate,
    end_date: endDate,
    reason,
    status: "approved",
    requested_by: userId,
    decided_by: userId,
    decided_at: new Date().toISOString(),
  });

  revalidatePath("/pontaj/concedii");
}

export async function decideTimeOff(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!requestId || (decision !== "approved" && decision !== "rejected")) return;

  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  await supabase
    .from("time_off_requests")
    .update({ status: decision, decided_by: userId, decided_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("organization_id", organization.id);

  revalidatePath("/pontaj/concedii");
}

export async function deleteTimeOff(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) return;

  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  await supabase.from("time_off_requests").delete().eq("id", requestId).eq("organization_id", organization.id);

  revalidatePath("/pontaj/concedii");
}
