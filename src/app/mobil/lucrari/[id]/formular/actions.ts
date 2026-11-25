"use server";

import { revalidatePath } from "next/cache";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FORM_TEMPLATES, missingRequired, type JobFormId } from "@/lib/forms/templates";
import { acceptClientTime } from "@/lib/client-time";
import { confirmAi } from "@/app/mobil/ai/actions";

// Saves a draft (every step) or the finished form (complete = true). A finished
// form must have every required field.
export async function saveJobForm(
  jobId: string,
  templateId: string,
  data: Record<string, unknown>,
  complete: boolean,
  // Ora reală de pe telefon (formular completat fără semnal și trimis mai târziu).
  at?: string
): Promise<{ ok: true } | { error: string; missing?: string[] }> {
  const template = FORM_TEMPLATES[templateId as JobFormId];
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
    // Plăcuțe citite cu AI: în jurnal intră ce a rămas după verificarea omului; propunerile nu se păstrează în formular.
    const ai = data.__ai && typeof data.__ai === "object" ? (data.__ai as Record<string, Record<string, unknown>>) : null;
    if (ai) {
      for (const [logId, suggested] of Object.entries(ai).slice(0, 20)) {
        await confirmAi(logId, suggested, Object.fromEntries(Object.keys(suggested).map((k) => [k, data[k] ?? null])));
      }
      data = Object.fromEntries(Object.entries(data).filter(([k]) => k !== "__ai"));
    }
  }

  const { error } = await supabase.from("job_forms").upsert(
    {
      organization_id: organization.id,
      job_id: jobId,
      template: template.id,
      data: data as never,
      updated_at: acceptClientTime(at),
      completed_by: complete ? userId : null,
      completed_at: complete ? acceptClientTime(at) : null,
    },
    { onConflict: "job_id,template" }
  );
  if (error) return { error: "Nu am putut salva formularul. Încearcă din nou." };

  revalidatePath(`/mobil/lucrari/${jobId}`);
  revalidatePath(`/lucrari/${jobId}`);
  return { ok: true };
}
