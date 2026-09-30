"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";

export async function createInvoiceForJob(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  const laborAmount = Number(formData.get("laborAmount") ?? 0) || 0;
  const materialsAmount = Number(formData.get("materialsAmount") ?? 0) || 0;
  const travelAmount = Number(formData.get("travelAmount") ?? 0) || 0;
  const otherAmount = Number(formData.get("otherAmount") ?? 0) || 0;
  const total = laborAmount + materialsAmount + travelAmount + otherAmount;
  if (!jobId || total <= 0) return;

  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("client_id")
    .eq("id", jobId)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!job) return;

  // count(*) + 1 raced under concurrent invoice creation — two requests could
  // read the same count before either insert committed, producing duplicate
  // numbers. next_invoice_number() increments a per-org counter atomically
  // (row-locked by Postgres via ON CONFLICT), so concurrent calls always get
  // distinct numbers.
  const { data: nextNumber, error: numberError } = await supabase.rpc("next_invoice_number", {
    p_organization_id: organization.id,
  });
  if (numberError || !nextNumber) return;
  const invoiceNumber = `FACT-${String(nextNumber).padStart(4, "0")}`;

  // total_amount is a DB-generated column (sum of the four below) — sending
  // it explicitly is rejected outright, not just ignored.
  await supabase.from("invoices").insert({
    organization_id: organization.id,
    client_id: job.client_id,
    job_id: jobId,
    invoice_number: invoiceNumber,
    labor_amount: laborAmount,
    materials_amount: materialsAmount,
    travel_amount: travelAmount,
    other_amount: otherAmount,
    created_by: userId,
  });

  revalidatePath("/facturare");
}

export async function markInvoicePaid(formData: FormData) {
  const invoiceId = String(formData.get("invoiceId") ?? "");
  if (!invoiceId) return;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();
  await supabase
    .from("invoices")
    .update({ status: "paid" })
    .eq("id", invoiceId)
    .eq("organization_id", organization.id);
  revalidatePath("/facturare");
}
