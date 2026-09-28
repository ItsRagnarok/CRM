"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";
import type { Database } from "@/lib/supabase/database.types";

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
      team_id: String(formData.get("teamId") ?? "") || null,
    })
    .eq("id", jobId)
    .eq("organization_id", organization.id);

  if (error) return { error: "Nu am putut salva modificările." };

  revalidatePath(`/lucrari/${jobId}`);
  revalidatePath("/lucrari");
  redirect(`/lucrari/${jobId}`);
}

export async function addExpense(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  const category = String(formData.get("category") ?? "").trim();
  const amount = Number(formData.get("amount"));
  if (!jobId || !category || !Number.isFinite(amount) || amount <= 0) return;

  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  await supabase.from("expenses").insert({
    organization_id: organization.id,
    job_id: jobId,
    category,
    vendor: String(formData.get("vendor") ?? "").trim() || null,
    amount,
    submitted_by: userId,
  });

  revalidatePath(`/lucrari/${jobId}`);
}

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

  const { data: created } = await supabase
    .from("job_checklists")
    .insert({ job_id: jobId, phase })
    .select("id")
    .single();
  return created?.id ?? null;
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
