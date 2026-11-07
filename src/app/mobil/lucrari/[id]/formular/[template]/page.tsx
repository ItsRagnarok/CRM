import { notFound } from "next/navigation";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FORM_TEMPLATES, type FormTemplate } from "@/lib/forms/templates";
import { FormRunner } from "./form-runner";

export default async function JobFormPage({ params }: { params: Promise<{ id: string; template: string }> }) {
  const { id, template: templateId } = await params;
  const template = FORM_TEMPLATES[templateId as FormTemplate["id"]];
  if (!template) notFound();

  const { organization } = await requireSessionContext();
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("id, display_number, title").eq("id", id).eq("organization_id", organization.id).maybeSingle();
  if (!job) notFound();
  const { data: saved } = await supabase.from("job_forms").select("data, completed_at").eq("job_id", id).eq("template", template.id).maybeSingle();

  return (
    <FormRunner
      jobId={id}
      jobLabel={`#${job.display_number} · ${job.title}`}
      template={template}
      initialData={(saved?.data ?? {}) as Record<string, unknown>}
      alreadyCompleted={Boolean(saved?.completed_at)}
    />
  );
}
