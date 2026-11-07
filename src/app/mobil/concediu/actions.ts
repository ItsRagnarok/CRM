"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";
import { notifyBackOffice } from "@/lib/notify";

export async function requestTimeOff(formData: FormData) {
  const type = String(formData.get("type") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (!type || !startDate || !endDate) return;

  const { organization, profile } = await requireSessionContext();
  const supabase = await createClient();

  await supabase.from("time_off_requests").insert({
    organization_id: organization.id,
    profile_id: profile.id,
    type,
    start_date: startDate,
    end_date: endDate,
    reason,
    status: "pending",
    requested_by: profile.id,
  });

  await notifyBackOffice(supabase, {
    organizationId: organization.id,
    type: "time_off_request",
    title: "Cerere de concediu",
    body: `${profile.full_name} cere liber între ${startDate} și ${endDate}`,
    link: "/pontaj/concedii",
  });

  revalidatePath("/mobil/concediu");
}
