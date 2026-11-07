"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notifyBackOffice } from "@/lib/notify";

const METHODS = ["numerar", "card", "transfer"] as const;

// The technician hands billing to the office: what was done, and what (if
// anything) he collected on the spot. The office issues the invoice.
export async function sendBillingRequest(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  const methodRaw = String(formData.get("method") ?? "");
  const method = (METHODS as readonly string[]).includes(methodRaw) ? methodRaw : null;
  const amountRaw = Number(String(formData.get("amount") ?? "").replace(",", "."));
  const amount = method && Number.isFinite(amountRaw) && amountRaw > 0 ? amountRaw : null;
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;
  if (!jobId) return;

  const { organization, userId, profile, readOnly } = await requireSessionContext();
  if (readOnly) return;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, display_number, title")
    .eq("id", jobId)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!job) return;

  const { error } = await supabase.from("billing_requests").insert({
    organization_id: organization.id,
    job_id: jobId,
    requested_by: userId,
    collected_method: method,
    collected_amount: method ? amount : null,
    note,
  });
  // A second tap (unique index: one open request per job) is not an error for the technician.
  if (!error) {
    await notifyBackOffice(supabase, {
      organizationId: organization.id,
      type: "job_finished",
      title: "De facturat",
      body: `${profile.full_name} a închis lucrarea #${job.display_number} (${job.title})${method && amount ? ` și a încasat ${amount.toFixed(2)} lei (${method})` : ""}.`,
      jobId,
      link: "/facturare",
    });
  }

  revalidatePath("/facturare");
  redirect(`/mobil/lucrari/${jobId}/gata`);
}
