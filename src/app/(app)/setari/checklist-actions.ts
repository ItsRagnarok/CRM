"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";
import type { Database } from "@/lib/supabase/database.types";

type JobType = Database["public"]["Enums"]["job_type"];

async function getOrCreateTemplate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  userId: string,
  jobType: JobType | null
) {
  let query = supabase.from("checklist_templates").select("id").eq("organization_id", organizationId);
  query = jobType ? query.eq("job_type", jobType) : query.is("job_type", null);
  const { data: existing } = await query.maybeSingle();
  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("checklist_templates")
    .insert({
      organization_id: organizationId,
      job_type: jobType,
      name: jobType ?? "Implicit (toate tipurile)",
      created_by: userId,
    })
    .select("id")
    .single();
  return created?.id ?? null;
}

export async function addChecklistTemplateItem(formData: FormData) {
  const jobTypeRaw = String(formData.get("jobType") ?? "").trim();
  const jobType = (jobTypeRaw || null) as JobType | null;
  const phase = String(formData.get("phase") ?? "before") as "before" | "after";
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return;

  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  const templateId = await getOrCreateTemplate(supabase, organization.id, userId, jobType);
  if (!templateId) return;

  const { count } = await supabase
    .from("checklist_template_items")
    .select("id", { count: "exact", head: true })
    .eq("template_id", templateId)
    .eq("phase", phase);

  await supabase.from("checklist_template_items").insert({
    template_id: templateId,
    phase,
    label,
    sort_order: count ?? 0,
  });

  revalidatePath("/setari");
}

export async function deleteChecklistTemplateItem(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return;

  const supabase = await createClient();
  await supabase.from("checklist_template_items").delete().eq("id", itemId);

  revalidatePath("/setari");
}
