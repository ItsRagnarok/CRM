"use server";

import { revalidatePath } from "next/cache";
import { requireBackOfficeContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notifyProfiles } from "@/lib/notify";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function reviewTimeCorrection(decision: "approve" | "reject", formData: FormData) {
  const ctx = await requireBackOfficeContext();
  if (!ctx || ctx.readOnly) return;
  const id = String(formData.get("id") ?? "");
  const approve = decision === "approve";
  const note = String(formData.get("note") ?? "").trim().slice(0, 300);
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  const { data: c } = await supabase.from("time_corrections").select("profile_id, job_id").eq("id", id).eq("organization_id", ctx.organization.id).maybeSingle();
  const { data: result } = await supabase.rpc("review_time_correction", { p_id: id, p_approve: approve, p_note: note || undefined });
  if (c && (result === "approved" || result === "rejected")) {
    await notifyProfiles(supabase, {
      organizationId: ctx.organization.id,
      profileIds: [c.profile_id],
      type: "time_correction",
      title: approve ? "Corecția de pontaj a fost aprobată" : "Corecția de pontaj a fost respinsă",
      body: note || (approve ? "Ora din pontaj a fost actualizată." : "Ora din pontaj rămâne neschimbată."),
      jobId: c.job_id,
      link: "/mobil/pontaj",
    }).catch(() => {});
  }
  revalidatePath("/pontaj");
  revalidatePath("/mobil/pontaj");
}
