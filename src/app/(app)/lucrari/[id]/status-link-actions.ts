"use server";

import { revalidatePath } from "next/cache";
import { requireBackOfficeContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createStatusLink(formData: FormData) {
  const ctx = await requireBackOfficeContext();
  const jobId = String(formData.get("jobId") ?? "");
  if (!ctx || !UUID.test(jobId)) return;
  const supabase = await createClient();
  // A job has at most one live link: revoke the old one, then issue a new token.
  await supabase.from("job_status_links").update({ revoked_at: new Date().toISOString() }).eq("job_id", jobId).eq("organization_id", ctx.organization.id).is("revoked_at", null);
  await supabase.from("job_status_links").insert({ organization_id: ctx.organization.id, job_id: jobId });
  revalidatePath(`/lucrari/${jobId}`);
}

export async function revokeStatusLink(formData: FormData) {
  const ctx = await requireBackOfficeContext();
  const jobId = String(formData.get("jobId") ?? "");
  if (!ctx || !UUID.test(jobId)) return;
  const supabase = await createClient();
  await supabase.from("job_status_links").update({ revoked_at: new Date().toISOString() }).eq("job_id", jobId).eq("organization_id", ctx.organization.id).is("revoked_at", null);
  revalidatePath(`/lucrari/${jobId}`);
}

/** Documentul intră (sau iese) din pachetul pe care clientul îl vede pe linkul de status. */
export async function toggleDocumentForClient(formData: FormData) {
  const ctx = await requireBackOfficeContext();
  const docId = String(formData.get("documentId") ?? "");
  const jobId = String(formData.get("jobId") ?? "");
  if (!ctx || !UUID.test(docId) || !UUID.test(jobId)) return;
  const supabase = await createClient();
  await supabase.from("documents").update({ client_visible: formData.get("on") === "1" }).eq("id", docId).eq("organization_id", ctx.organization.id);
  revalidatePath(`/lucrari/${jobId}`);
}
