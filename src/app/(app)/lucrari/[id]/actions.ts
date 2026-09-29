"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";
import type { Database } from "@/lib/supabase/database.types";
import { syncJobAssignmentsToTeam } from "../team-sync";
import { geocodeAddress } from "@/lib/geocode";

type JobType = Database["public"]["Enums"]["job_type"];
type JobPriority = Database["public"]["Enums"]["job_priority"];

export async function updateJob(
  jobId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const scheduledDate = String(formData.get("scheduledDate") ?? "");
  if (!title || !scheduledDate) {
    return { error: "Titlul și data sunt obligatorii." };
  }

  const teamId = String(formData.get("teamId") ?? "") || null;
  const address = String(formData.get("address") ?? "").trim();
  const currentAddress = String(formData.get("currentAddress") ?? "").trim();

  const { error } = await supabase
    .from("jobs")
    .update({
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      job_type: String(formData.get("jobType") ?? "interventie") as JobType,
      priority: String(formData.get("priority") ?? "normala") as JobPriority,
      scheduled_date: scheduledDate,
      start_time: String(formData.get("startTime") ?? "") || null,
      end_time: String(formData.get("endTime") ?? "") || null,
      team_id: teamId,
    })
    .eq("id", jobId)
    .eq("organization_id", organization.id);

  if (error) return { error: "Nu am putut salva modificările." };

  // Only re-geocode when the address text actually changed — avoids hammering
  // the free geocoding service on every save when nothing about it moved.
  if (address && address !== currentAddress) {
    const { data: job } = await supabase.from("jobs").select("location_id, client_id").eq("id", jobId).single();
    const coords = await geocodeAddress(address);

    if (job?.location_id) {
      await supabase
        .from("locations")
        .update({ address, lat: coords?.lat ?? null, lng: coords?.lng ?? null })
        .eq("id", job.location_id);
    } else if (job) {
      const { data: newLocation } = await supabase
        .from("locations")
        .insert({
          organization_id: organization.id,
          client_id: job.client_id,
          address,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
        })
        .select("id")
        .single();
      if (newLocation) {
        await supabase.from("jobs").update({ location_id: newLocation.id }).eq("id", jobId);
      }
    }
  }

  await syncJobAssignmentsToTeam(supabase, jobId, teamId);

  revalidatePath(`/lucrari/${jobId}`);
  revalidatePath("/lucrari");
  revalidatePath("/mobil");
  revalidatePath("/mobil/lucrari");
  revalidatePath("/harta");
  revalidatePath("/dashboard");
  redirect(`/lucrari/${jobId}`);
}

export async function addExpense(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  const category = String(formData.get("category") ?? "").trim();
  const amount = Number(formData.get("amount"));
  if (!jobId || !category || !Number.isFinite(amount) || amount <= 0) return;

  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  let receiptPath: string | null = null;
  const receipt = formData.get("receipt") as File | null;
  if (receipt && receipt.size > 0) {
    const safeName = receipt.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${organization.id}/jobs/${jobId}/receipts/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(path, receipt, { contentType: receipt.type || "application/octet-stream" });
    if (!uploadError) receiptPath = path;
  }

  await supabase.from("expenses").insert({
    organization_id: organization.id,
    job_id: jobId,
    category,
    vendor: String(formData.get("vendor") ?? "").trim() || null,
    amount,
    submitted_by: userId,
    receipt_path: receiptPath,
  });

  revalidatePath(`/lucrari/${jobId}`);
  revalidatePath("/cheltuieli");
}

// Seeds a job's checklist from the organization's admin-defined template (if
// one exists for that job_type, falling back to a generic org-wide template)
// the first time it's opened. Seeded items are locked so the technician can
// only check them, not delete them — they can still add their own extra
// items on top, which stay deletable.
export async function ensureChecklist(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string,
  phase: "before" | "after" = "after"
) {
  const { data: existing } = await supabase
    .from("job_checklists")
    .select("id")
    .eq("job_id", jobId)
    .eq("phase", phase)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: job } = await supabase
    .from("jobs")
    .select("job_type, organization_id")
    .eq("id", jobId)
    .maybeSingle();

  let templateId: string | null = null;
  let templateItems: { label: string; sort_order: number }[] = [];

  if (job) {
    const { data: templates } = await supabase
      .from("checklist_templates")
      .select("id, job_type, checklist_template_items(label, sort_order, phase)")
      .eq("organization_id", job.organization_id)
      .eq("is_active", true);

    const matching =
      (templates ?? []).find((t) => t.job_type === job.job_type) ??
      (templates ?? []).find((t) => t.job_type === null);

    if (matching) {
      templateId = matching.id;
      templateItems = (matching.checklist_template_items ?? [])
        .filter((i) => i.phase === phase)
        .sort((a, b) => a.sort_order - b.sort_order);
    }
  }

  const { data: created } = await supabase
    .from("job_checklists")
    .insert({ job_id: jobId, phase, template_id: templateId })
    .select("id")
    .single();
  if (!created) return null;

  if (templateItems.length > 0) {
    await supabase.from("job_checklist_items").insert(
      templateItems.map((item, i) => ({
        job_checklist_id: created.id,
        label: item.label,
        sort_order: i,
        locked: true,
      }))
    );
  }

  return created.id;
}

export async function addChecklistItem(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const phase = String(formData.get("phase") ?? "after") as "before" | "after";
  if (!jobId || !label) return;

  const supabase = await createClient();
  const checklistId = await ensureChecklist(supabase, jobId, phase);
  if (!checklistId) return;

  const { count } = await supabase
    .from("job_checklist_items")
    .select("id", { count: "exact", head: true })
    .eq("job_checklist_id", checklistId);

  await supabase.from("job_checklist_items").insert({
    job_checklist_id: checklistId,
    label,
    sort_order: count ?? 0,
  });

  revalidatePath(`/lucrari/${jobId}`);
  revalidatePath(`/mobil/lucrari/${jobId}/checklist`);
  revalidatePath(`/mobil/lucrari/${jobId}/finalizare`);
}

export async function toggleChecklistItem(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const jobId = String(formData.get("jobId") ?? "");
  const isChecked = String(formData.get("isChecked") ?? "false") === "true";
  if (!itemId) return;

  const { userId } = await requireSessionContext();
  const supabase = await createClient();

  await supabase
    .from("job_checklist_items")
    .update({
      is_checked: !isChecked,
      checked_at: !isChecked ? new Date().toISOString() : null,
      checked_by: !isChecked ? userId : null,
    })
    .eq("id", itemId);

  revalidatePath(`/lucrari/${jobId}`);
  revalidatePath(`/mobil/lucrari/${jobId}/checklist`);
  revalidatePath(`/mobil/lucrari/${jobId}/finalizare`);
}

export async function deleteChecklistItem(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const jobId = String(formData.get("jobId") ?? "");
  if (!itemId) return;

  const supabase = await createClient();
  // Admin-defined checklist items are locked — a technician can check them
  // off but can't remove them, only delete extras they added themselves.
  const { data: item } = await supabase
    .from("job_checklist_items")
    .select("locked")
    .eq("id", itemId)
    .maybeSingle();
  if (item?.locked) return;

  await supabase.from("job_checklist_items").delete().eq("id", itemId);
  revalidatePath(`/lucrari/${jobId}`);
  revalidatePath(`/mobil/lucrari/${jobId}/checklist`);
  revalidatePath(`/mobil/lucrari/${jobId}/finalizare`);
}

export async function uploadDocument(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  const file = formData.get("file") as File | null;
  if (!jobId || !file || file.size === 0) return;

  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${organization.id}/jobs/${jobId}/documents/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (uploadError) return;

  await supabase.from("documents").insert({
    organization_id: organization.id,
    job_id: jobId,
    name: file.name,
    doc_type: String(formData.get("docType") ?? "").trim() || null,
    storage_path: path,
    uploaded_by: userId,
  });

  revalidatePath(`/lucrari/${jobId}`);
}

export async function addRequiredItem(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  const kind = String(formData.get("kind") ?? "material") as "material" | "tool";
  const materialId = String(formData.get("materialId") ?? "").trim() || null;
  const customName = String(formData.get("customName") ?? "").trim() || null;
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1) || 1);
  if (!jobId || (!materialId && !customName)) return;

  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  await supabase.from("job_required_items").insert({
    organization_id: organization.id,
    job_id: jobId,
    kind,
    material_id: materialId,
    custom_name: materialId ? null : customName,
    quantity_needed: quantity,
    created_by: userId,
  });

  revalidatePath(`/lucrari/${jobId}`);
  revalidatePath(`/mobil/materiale`);
}

export async function deleteRequiredItem(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const jobId = String(formData.get("jobId") ?? "");
  if (!itemId) return;

  const supabase = await createClient();
  await supabase.from("job_required_items").delete().eq("id", itemId);
  revalidatePath(`/lucrari/${jobId}`);
  revalidatePath(`/mobil/materiale`);
}

export async function decidePurchaseRequest(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");
  const decision = String(formData.get("decision") ?? "") as "approved" | "denied";
  if (!requestId || (decision !== "approved" && decision !== "denied")) return;

  const { userId } = await requireSessionContext();
  const supabase = await createClient();

  await supabase
    .from("purchase_requests")
    .update({ status: decision, decided_by: userId, decided_at: new Date().toISOString() })
    .eq("id", requestId);

  revalidatePath("/aprobari");
}

export async function deleteDocument(formData: FormData) {
  const documentId = String(formData.get("documentId") ?? "");
  const storagePath = String(formData.get("storagePath") ?? "");
  const jobId = String(formData.get("jobId") ?? "");
  if (!documentId) return;

  const supabase = await createClient();
  if (storagePath) {
    await supabase.storage.from("attachments").remove([storagePath]);
  }
  await supabase.from("documents").delete().eq("id", documentId);
  revalidatePath(`/lucrari/${jobId}`);
}
