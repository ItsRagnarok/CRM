"use server";

import { revalidatePath } from "next/cache";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FORM_TEMPLATES, missingRequired, type FormTemplate } from "@/lib/forms/templates";

// Saves a draft (every step) or the finished form (complete = true). A finished
// form must have every required field.
export async function saveJobForm(
  jobId: string,
  templateId: string,
  data: Record<string, unknown>,
  complete: boolean
): Promise<{ ok: true } | { error: string; missing?: string[] }> {
  const template = FORM_TEMPLATES[templateId as FormTemplate["id"]];
  if (!template) return { error: "Formular necunoscut." };
  // Keep the payload small and plain: this lands in a jsonb column.
  if (JSON.stringify(data).length > 60_000) return { error: "Formularul e prea mare." };

  const { organization, userId, readOnly } = await requireSessionContext();
  if (readOnly) return { error: "Modul de vizualizare nu permite salvarea." };
  const supabase = await createClient();

  const { data: job } = await supabase.from("jobs").select("id").eq("id", jobId).eq("organization_id", organization.id).maybeSingle();
  if (!job) return { error: "Lucrarea nu a fost găsită." };

  if (complete) {
    const missing = missingRequired(template, data);
    if (missing.length > 0) return { error: "Mai ai câmpuri obligatorii necompletate.", missing };
  }

  const { error } = await supabase.from("job_forms").upsert(
    {
      organization_id: organization.id,
      job_id: jobId,
      template: template.id,
      data: data as never,
      updated_at: new Date().toISOString(),
      completed_by: complete ? userId : null,
      completed_at: complete ? new Date().toISOString() : null,
    },
    { onConflict: "job_id,template" }
  );
  if (error) return { error: "Nu am putut salva formularul. Încearcă din nou." };

  revalidatePath(`/mobil/lucrari/${jobId}`);
  revalidatePath(`/lucrari/${jobId}`);
  return { ok: true };
}
