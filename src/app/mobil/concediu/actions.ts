"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";

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

  revalidatePath("/mobil/concediu");
}
