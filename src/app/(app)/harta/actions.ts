"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";

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
