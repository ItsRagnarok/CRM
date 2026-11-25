"use server";

import { revalidatePath } from "next/cache";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notifyBackOffice } from "@/lib/notify";
import { INCIDENT_LABEL, type IncidentKind } from "@/lib/ssm";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KINDS = ["accident", "aproape", "incident_periculos", "echipament"];

/** Omul confirmă instruirea SSM primită de la birou. */
export async function confirmTraining(_prev: { ok?: boolean; error?: string } | undefined, fd: FormData) {
  const id = String(fd.get("id") ?? "");
  if (!UUID.test(id)) return { error: "Instruire necunoscută." };
  await requireSessionContext();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("ssm_confirm_training", { p_id: id });
  if (error || !data) return { error: "Nu am putut confirma. Încearcă din nou." };
  return { ok: true };
}

/**
 * Raport de incident din aplicație (online sau din coada telefonului). Sigur la retrimitere:
 * același opId nu creează două rapoarte. Poza ajunge în dosarul omului (o vede doar el și biroul).
 */
export async function reportIncident(fd: FormData): Promise<{ ok: true } | { error: string }> {
  const kind = String(fd.get("kind") ?? "");
  if (!KINDS.includes(kind)) return { error: "Alege ce s-a întâmplat." };
  const { organization, userId, profile } = await requireSessionContext();
  const supabase = await createClient();
  const opId = String(fd.get("opId") ?? "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64) || null;
  if (opId) {
    const { data: dup } = await supabase.from("ssm_incidents").select("id").eq("reported_by", userId).eq("client_op_id", opId).limit(1);
    if (dup?.length) return { ok: true };
  }
  const jobIdRaw = String(fd.get("jobId") ?? "");
  const jobId = UUID.test(jobIdRaw) ? jobIdRaw : null;
  const num = (v: FormDataEntryValue | null, max: number) => {
    const n = Number(v);
    return v !== null && v !== "" && Number.isFinite(n) && Math.abs(n) <= max ? n : null;
  };
  const atRaw = String(fd.get("occurredAt") ?? "");
  const at = !Number.isNaN(Date.parse(atRaw)) && Date.parse(atRaw) <= Date.now() + 5 * 60_000 && Date.parse(atRaw) > Date.now() - 7 * 86_400_000 ? new Date(atRaw).toISOString() : new Date().toISOString();

  let photoPath: string | null = null;
  const file = fd.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > 15 * 1024 * 1024) return { error: "Poza e prea mare." };
    const path = `${organization.id}/employees/${userId}/ssm/${opId ?? Date.now()}.jpg`;
    const { error: up } = await supabase.storage.from("attachments").upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
    if (!up || /exist|duplicate/i.test(up.message)) photoPath = path;
  }

  const injured = kind === "accident" && fd.get("injured") === "1";
  const { data: row, error } = await supabase
    .from("ssm_incidents")
    .insert({
      organization_id: organization.id,
      reported_by: userId,
      job_id: jobId,
      kind,
      injured,
      description: String(fd.get("description") ?? "").trim().slice(0, 1000) || null,
      photo_path: photoPath,
      lat: num(fd.get("lat"), 90),
      lng: num(fd.get("lng"), 180),
      occurred_at: at,
      client_op_id: opId,
    })
    .select("id")
    .single();
  if (error || !row) return { error: "Nu am putut trimite raportul. Sună biroul." };

  await notifyBackOffice(supabase, {
    organizationId: organization.id,
    type: "ssm_incident",
    title: `${injured ? "Accident cu rănit" : INCIDENT_LABEL[kind as IncidentKind]} raportat`,
    body: `${profile.full_name}${fd.get("description") ? `: ${String(fd.get("description")).slice(0, 140)}` : ""}`,
    jobId,
    link: "/ssm?tab=incidente",
    exceptProfileId: userId,
  });
  revalidatePath("/mobil/ssm");
  return { ok: true };
}
