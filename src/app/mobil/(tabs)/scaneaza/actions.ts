"use server";

import { revalidatePath } from "next/cache";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const SCAN_TYPES = ["bon", "factura", "eticheta", "document"] as const;
export type ScanType = (typeof SCAN_TYPES)[number];

const SCAN_LABELS: Record<ScanType, string> = { bon: "Bon", factura: "Factură", eticheta: "Etichetă", document: "Document" };

// Saves a photographed paper (receipt, supplier invoice, equipment label, any
// document) into the organization's storage and the documents list, optionally
// tied to a job. Reading the text out of it automatically (AI) plugs in after this step.
export async function saveScan(formData: FormData): Promise<{ error?: string; ok?: true }> {
  const type = String(formData.get("type") ?? "document") as ScanType;
  const jobId = String(formData.get("jobId") ?? "") || null;
  const note = String(formData.get("note") ?? "").trim();
  const files = formData.getAll("pages").filter((f): f is File => f instanceof File && f.size > 0);
  if (!SCAN_TYPES.includes(type)) return { error: "Tip de document necunoscut." };
  if (files.length === 0) return { error: "Nu ai făcut nicio poză." };
  if (files.some((f) => f.size > 4 * 1024 * 1024)) return { error: "Poza e prea mare. Încearcă din nou." };

  const { organization, userId, readOnly } = await requireSessionContext();
  if (readOnly) return { error: "Modul de vizualizare nu permite salvarea." };
  const supabase = await createClient();

  if (jobId) {
    const { data: job } = await supabase.from("jobs").select("id").eq("id", jobId).eq("organization_id", organization.id).maybeSingle();
    if (!job) return { error: "Lucrarea nu a fost găsită." };
  }

  const stamp = Date.now();
  const label = SCAN_LABELS[type];
  for (const [index, file] of files.entries()) {
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_") || "scan.jpg";
    const path = `${organization.id}/scans/${userId}/${stamp}-${index}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("attachments").upload(path, file, { contentType: file.type || "image/jpeg" });
    if (uploadError) return { error: "Nu am putut încărca poza. Verifică semnalul și încearcă din nou." };

    const { error } = await supabase.from("documents").insert({
      organization_id: organization.id,
      profile_id: userId,
      job_id: jobId,
      uploaded_by: userId,
      name: `${label}${note ? ` — ${note}` : ""}${files.length > 1 ? ` (pagina ${index + 1})` : ""}`,
      doc_type: type,
      storage_path: path,
    });
    if (error) return { error: "Poza s-a încărcat, dar nu am putut-o salva în documente." };
  }

  revalidatePath("/mobil/documente");
  if (jobId) revalidatePath(`/lucrari/${jobId}`);
  return { ok: true };
}
