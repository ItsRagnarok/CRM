"use server";

import { revalidatePath } from "next/cache";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { acceptClientTime } from "@/lib/client-time";
import { todayInOrgTimeZone } from "@/lib/date";
import { missingRequired } from "@/lib/forms/templates";
import { GAS_TEMPLATES, summarizeGasRecord } from "@/lib/forms/gas-record";
import type { Json } from "@/lib/supabase/database.types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
type SaveResult = { ok: true; id: string } | { error: string; missing?: string[] };

async function jobAndUnit(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string, jobId: string, unitId: string | null) {
  const { data: job } = await supabase.from("jobs").select("id, gas_building_id").eq("id", jobId).eq("organization_id", orgId).maybeSingle();
  if (!job) return { error: "Lucrarea nu a fost găsită." } as const;
  if (unitId) {
    const { data: unit } = await supabase.from("gas_units").select("id, building_id").eq("id", unitId).eq("organization_id", orgId).maybeSingle();
    if (!unit || unit.building_id !== job.gas_building_id) return { error: "Apartamentul nu face parte din blocul acestei lucrări." } as const;
  }
  return { job } as const;
}

/**
 * Salvează fișa de evidență (ciornă la fiecare pas, încheiată la final). Merge și din coada
 * offline: `at` e ora reală de pe telefon, iar data întocmirii se ia din ea.
 */
export async function saveGasRecord(input: {
  jobId: string;
  unitId: string | null;
  kind: "verificare" | "revizie";
  data: Record<string, unknown>;
  complete: boolean;
  at?: string;
}): Promise<SaveResult> {
  const { jobId, unitId, kind, complete } = input;
  if (!UUID.test(jobId) || (unitId !== null && !UUID.test(unitId)) || (kind !== "verificare" && kind !== "revizie")) return { error: "Cerere invalidă." };
  // Trei semnături mici (PNG) + datele: încape lejer; limita oprește abuzul.
  if (JSON.stringify(input.data).length > 350_000) return { error: "Fișa e prea mare. Refă semnăturile." };

  const { organization, userId, readOnly } = await requireSessionContext();
  if (readOnly) return { error: "Modul de vizualizare nu permite salvarea." };
  const supabase = await createClient();
  const found = await jobAndUnit(supabase, organization.id, jobId, unitId);
  if ("error" in found) return { error: found.error ?? "Cerere invalidă." };

  const template = GAS_TEMPLATES[kind];
  if (complete) {
    const missing = missingRequired(template, input.data);
    if (missing.length) return { error: "Mai ai câmpuri obligatorii necompletate.", missing };
  }

  let q = supabase.from("gas_records").select("id, completed_at").eq("job_id", jobId);
  q = unitId ? q.eq("unit_id", unitId) : q.is("unit_id", null);
  const { data: existing } = await q.maybeSingle();
  if (existing?.completed_at) return { error: "Fișa pentru acest loc de consum e deja încheiată. Pentru corecturi, cere biroului." };

  const at = acceptClientTime(input.at);
  const summary = summarizeGasRecord(input.data);
  const data = {
    ...input.data,
    doc_cos_data: summary.docCos,
    doc_iscir_data: summary.docIscir,
  };
  const notice = typeof input.data.scadenta_notificare === "string" && ISO_DATE.test(input.data.scadenta_notificare) ? input.data.scadenta_notificare : null;
  const row = {
    kind,
    data: data as Json,
    conform: summary.conform,
    gas_interrupted: summary.gasInterrupted,
    notice_due_on: notice,
    drawn_up_on: complete ? todayInOrgTimeZone(new Date(at)) : null,
    completed_at: complete ? at : null,
    completed_by: complete ? userId : null,
  };

  const res = existing
    ? await supabase.from("gas_records").update(row).eq("id", existing.id).select("id").single()
    : await supabase.from("gas_records").insert({ ...row, organization_id: organization.id, job_id: jobId, unit_id: unitId }).select("id").single();
  if (res.error || !res.data) {
    return { error: /încheiată/.test(res.error?.message ?? "") ? "Fișa e deja încheiată." : "Nu am putut salva fișa. Încearcă din nou." };
  }

  revalidatePath(`/mobil/lucrari/${jobId}`);
  revalidatePath(`/mobil/lucrari/${jobId}/bloc`);
  revalidatePath("/gaze/fise");
  return { ok: true, id: res.data.id };
}

/** Absent / refuz / reprogramat pe un apartament din bloc. Idempotent pe opId (coada offline). */
export async function recordGasVisit(input: {
  opId: string;
  jobId: string;
  unitId: string;
  outcome: "absent" | "refuz" | "reprogramat";
  rescheduleOn: string | null;
  note: string;
  at?: string;
}): Promise<{ ok: true } | { error: string }> {
  const { opId, jobId, unitId, outcome } = input;
  if (!UUID.test(jobId) || !UUID.test(unitId) || !["absent", "refuz", "reprogramat"].includes(outcome) || !/^[\w-]{8,64}$/.test(opId)) return { error: "Cerere invalidă." };
  const reschedule = outcome === "reprogramat" && input.rescheduleOn && ISO_DATE.test(input.rescheduleOn) ? input.rescheduleOn : null;
  if (outcome === "reprogramat" && !reschedule) return { error: "Alege data reprogramării." };

  const { organization, userId, readOnly } = await requireSessionContext();
  if (readOnly) return { error: "Modul de vizualizare nu permite salvarea." };
  const supabase = await createClient();
  const found = await jobAndUnit(supabase, organization.id, jobId, unitId);
  if ("error" in found) return { error: found.error ?? "Cerere invalidă." };

  const { error } = await supabase.from("gas_visits").insert({
    organization_id: organization.id,
    job_id: jobId,
    unit_id: unitId,
    outcome,
    reschedule_on: reschedule,
    note: input.note.trim().slice(0, 300) || null,
    op_id: opId,
    created_by: userId,
    occurred_at: acceptClientTime(input.at),
  });
  if (error && error.code !== "23505") return { error: "Nu am putut salva. Încearcă din nou." };
  revalidatePath(`/mobil/lucrari/${jobId}/bloc`);
  return { ok: true };
}
