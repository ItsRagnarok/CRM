"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";
import { notifyBackOffice, notifyProfiles } from "@/lib/notify";
import { mobileStagePath, type MobileStage } from "./mobile-stage";
import { acceptClientTime, safeOpId } from "@/lib/client-time";
import { TEMPLATES, checkResult, type Template } from "@/lib/ssm";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type SyncResult = { ok: true } | { error: string };

function paths(jobId: string) {
  revalidatePath(`/mobil/lucrari/${jobId}`);
  revalidatePath(`/lucrari/${jobId}`);
  revalidatePath("/mobil");
  revalidatePath("/mobil/lucrari");
}

// Pre-departure stages a technician walks through before status flips to
// "in_drum": checklist (materials/tools to take) -> depozit (pick a route
// through the warehouse or skip it) -> cheltuiala (log anything bought to
// cover what's missing) -> ready (map + actually start driving). Stored on
// the job itself so re-opening it after exiting resumes at the exact same
// screen instead of restarting the wizard.
export async function beginJobPrep(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) return;

  const { organization, userId, profile } = await requireSessionContext();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("mobile_stage, display_number, title")
    .eq("id", jobId)
    .eq("organization_id", organization.id)
    .maybeSingle();

  const stage = (job?.mobile_stage as MobileStage | null) ?? "checklist";
  if (!job?.mobile_stage) {
    // First press: the job goes "in curs" immediately — the whole
    // pre-departure wizard (checklist/depozit/cheltuiala/ready) now runs
    // under status in_drum rather than sitting as "programată" while the
    // technician is actively working through it.
    await supabase
      .from("jobs")
      .update({ mobile_stage: "checklist", status: "in_drum" })
      .eq("id", jobId)
      .eq("organization_id", organization.id);

    await supabase.from("time_entries").insert({
      organization_id: organization.id,
      job_id: jobId,
      profile_id: userId,
      event_type: "travel_start",
      occurred_at: new Date().toISOString(),
    });

    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("organization_id", organization.id)
      .in("role", ["admin", "manager"]);

    if (admins && admins.length > 0 && job) {
      await notifyProfiles(supabase, {
        organizationId: organization.id,
        profileIds: admins.map((a) => a.id),
        type: "job_started",
        title: "Lucrare pornită",
        body: `${profile.full_name} a pornit lucrarea #${job.display_number} — ${job.title}`,
        jobId,
        link: `/lucrari/${jobId}`,
      });
    }
  }

  paths(jobId);
  redirect(mobileStagePath(jobId, stage));
}

export async function advanceMobileStage(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  const stage = String(formData.get("stage") ?? "") as MobileStage;
  if (!jobId || !stage) return;

  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  await supabase
    .from("jobs")
    .update({ mobile_stage: stage })
    .eq("id", jobId)
    .eq("organization_id", organization.id);

  paths(jobId);
  redirect(mobileStagePath(jobId, stage));
}

export async function confirmDepotArrival(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) return;
  const lat = formData.get("lat") ? Number(formData.get("lat")) : null;
  const lng = formData.get("lng") ? Number(formData.get("lng")) : null;

  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  await supabase.from("time_entries").insert({
    organization_id: organization.id,
    job_id: jobId,
    profile_id: userId,
    event_type: "depot_arrival",
    occurred_at: new Date().toISOString(),
    lat,
    lng,
  });

  await supabase
    .from("jobs")
    .update({ mobile_stage: "ridicare" })
    .eq("id", jobId)
    .eq("organization_id", organization.id);

  paths(jobId);
  redirect(mobileStagePath(jobId, "ridicare"));
}

export async function toggleRequiredItemTaken(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const jobId = String(formData.get("jobId") ?? "");
  const taken = String(formData.get("taken") ?? "") === "true";
  if (!itemId) return;

  const supabase = await createClient();
  await supabase.from("job_required_items").update({ taken: !taken }).eq("id", itemId);

  revalidatePath(`/mobil/lucrari/${jobId}/checklist`);
  revalidatePath(`/mobil/lucrari/${jobId}/ridicare`);
}

export async function startTravel(jobId: string) {
  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  await supabase
    .from("jobs")
    .update({ status: "in_drum", mobile_stage: null })
    .eq("id", jobId)
    .eq("organization_id", organization.id);

  await supabase.from("time_entries").insert({
    organization_id: organization.id,
    job_id: jobId,
    profile_id: userId,
    event_type: "travel_start",
    occurred_at: new Date().toISOString(),
  });

  paths(jobId);
}

export async function arriveAtJob(jobId: string, lat?: number, lng?: number) {
  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();
  const now = new Date().toISOString();

  await supabase
    .from("jobs")
    .update({ status: "ajunsa", arrived_at: now })
    .eq("id", jobId)
    .eq("organization_id", organization.id);

  await supabase.from("time_entries").insert({
    organization_id: organization.id,
    job_id: jobId,
    profile_id: userId,
    event_type: "arrival",
    occurred_at: now,
    lat: lat ?? null,
    lng: lng ?? null,
  });

  paths(jobId);
}

export async function arriveAtJobForm(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) return;
  const lat = formData.get("lat") ? Number(formData.get("lat")) : undefined;
  const lng = formData.get("lng") ? Number(formData.get("lng")) : undefined;
  await arriveAtJob(jobId, lat, lng);
}

export async function startWork(jobId: string) {
  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();
  const now = new Date().toISOString();

  await supabase
    .from("jobs")
    .update({ status: "in_lucru", work_started_at: now })
    .eq("id", jobId)
    .eq("organization_id", organization.id);

  await supabase.from("time_entries").insert({
    organization_id: organization.id,
    job_id: jobId,
    profile_id: userId,
    event_type: "work_start",
    occurred_at: now,
  });

  paths(jobId);
}

export async function finalizeJob(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) return;
  await finalizeCore(jobId, String(formData.get("observations") ?? ""), String(formData.get("equipmentIssue") ?? ""), null);
  redirect(`/mobil/lucrari/${jobId}/semnatura`);
}

/**
 * Închiderea lucrării trimisă din aplicație (online sau din coada offline a telefonului).
 * `at` = ora reală a închiderii pe telefon. Sigură la retrimitere: dacă lucrarea e deja
 * închisă cu aceeași oră, nu mai face nimic.
 */
export async function syncFinalizeJob(input: { opId: string; jobId: string; observations: string; equipmentIssue: string; at: string }): Promise<SyncResult> {
  if (!UUID.test(String(input?.jobId)) || !safeOpId(input?.opId)) return { error: "Date invalide." };
  return finalizeCore(input.jobId, String(input.observations ?? ""), String(input.equipmentIssue ?? ""), input.at);
}

async function finalizeCore(jobId: string, observationsRaw: string, equipmentRaw: string, at: string | null): Promise<SyncResult> {
  const observations = observationsRaw.trim().slice(0, 4000);
  const equipmentIssue = equipmentRaw.trim().slice(0, 2000);
  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();
  const now = acceptClientTime(at);

  const { data: already } = await supabase.from("time_entries").select("id").eq("job_id", jobId).eq("profile_id", userId).eq("event_type", "work_end").eq("occurred_at", now).limit(1);
  if (already?.length) return { ok: true };

  await supabase
    .from("jobs")
    .update({
      status: "finalizata",
      work_ended_at: now,
      observations: observations || null,
      equipment_issue_note: equipmentIssue || null,
    })
    .eq("id", jobId)
    .eq("organization_id", organization.id);

  await supabase.from("time_entries").insert({
    organization_id: organization.id,
    job_id: jobId,
    profile_id: userId,
    event_type: "work_end",
    occurred_at: now,
  });

  const [{ data: doneJob }, { data: finisher }] = await Promise.all([
    supabase.from("jobs").select("display_number, title").eq("id", jobId).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
  ]);
  await notifyBackOffice(supabase, {
    organizationId: organization.id,
    type: "job_finished",
    title: "Lucrare finalizată",
    body: `${finisher?.full_name ?? "Tehnicianul"} a finalizat lucrarea #${doneJob?.display_number ?? ""} — ${doneJob?.title ?? ""}`,
    jobId,
  });

  paths(jobId);
  revalidatePath(`/mobil/lucrari/${jobId}/finalizare`);
  return { ok: true };
}

export async function uploadJobPhoto(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  const category = String(formData.get("category") ?? "in_timpul");
  const file = formData.get("file") as File | null;
  if (!jobId || !file || file.size === 0) return { error: "Nicio poză selectată." };

  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-80);
  // opId vine de pe telefon (o poză făcută fără semnal se trimite mai târziu, poate de două ori):
  // aceeași poză are mereu aceeași cale, deci a doua trimitere nu creează un duplicat.
  const opId = safeOpId(formData.get("opId"));
  const path = `${organization.id}/jobs/${jobId}/photos/${opId ?? Date.now()}-${safeName}`;
  if (opId) {
    const { data: existing } = await supabase.from("photos").select("id").eq("storage_path", path).limit(1);
    if (existing?.length) return;
  }

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(path, file, { contentType: file.type || "image/jpeg" });
  // Previously failed silently here — the technician saw "Se încarcă…" and
  // then nothing, stuck with no photo and no way to tell why.
  const duplicate = opId && uploadError && /exist|duplicate/i.test(uploadError.message);
  if (uploadError && !duplicate) return { error: `Încărcarea a eșuat: ${uploadError.message}` };

  const { error: insertError } = await supabase.from("photos").insert({
    organization_id: organization.id,
    job_id: jobId,
    category,
    storage_path: path,
    uploaded_by: userId,
    taken_at: acceptClientTime(formData.get("takenAt")),
  });
  // The file can land in storage just fine while this insert is rejected
  // (e.g. a category the DB doesn't recognize yet) — that combination is
  // exactly what caused photos to vanish silently before.
  if (insertError) return { error: `Nu am putut salva poza: ${insertError.message}` };

  revalidatePath(`/mobil/lucrari/${jobId}/foto`);
  revalidatePath(`/lucrari/${jobId}`);
}

export async function recordArrivalPromptDismissal(jobId: string) {
  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("arrival_prompts")
    .select("attempts")
    .eq("job_id", jobId)
    .maybeSingle();

  const attempts = (existing?.attempts ?? 0) + 1;

  await supabase.from("arrival_prompts").upsert({
    job_id: jobId,
    organization_id: organization.id,
    profile_id: userId,
    attempts,
    last_prompted_at: new Date().toISOString(),
  });

  if (attempts >= 3) {
    const [{ data: job }, { data: profile }] = await Promise.all([
      supabase.from("jobs").select("display_number, title").eq("id", jobId).maybeSingle(),
      supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    ]);
    await supabase.from("job_alerts").insert({
      organization_id: organization.id,
      job_id: jobId,
      profile_id: userId,
      kind: "arrival_not_confirmed",
      message: `${profile?.full_name ?? "Tehnicianul"} este de peste 3 ori în raza locației lucrării #${
        job?.display_number ?? ""
      } (${job?.title ?? "—"}) dar nu a confirmat sosirea.`,
    });
    await notifyBackOffice(supabase, {
      organizationId: organization.id,
      type: "job_alert",
      title: "Sosire neconfirmată",
      body: `${profile?.full_name ?? "Tehnicianul"} e la locația lucrării #${job?.display_number ?? ""} dar nu a confirmat sosirea.`,
      jobId,
    });
    revalidatePath("/harta");
    revalidatePath("/dashboard");
  }

  return { attempts };
}

export async function addJobNote(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  const kind = String(formData.get("kind") ?? "comment") as "problem" | "comment";
  const text = String(formData.get("text") ?? "").trim();
  if (!jobId || !text) return;

  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  let photoPath: string | null = null;
  const photo = formData.get("photo") as File | null;
  if (photo && photo.size > 0) {
    const safeName = photo.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${organization.id}/jobs/${jobId}/notes/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(path, photo, { contentType: photo.type || "image/jpeg" });
    if (!uploadError) photoPath = path;
  }

  await supabase.from("job_notes").insert({
    organization_id: organization.id,
    job_id: jobId,
    kind,
    text,
    photo_path: photoPath,
    created_by: userId,
  });

  if (kind === "problem") {
    const [{ data: noteJob }, { data: author }] = await Promise.all([
      supabase.from("jobs").select("display_number, title").eq("id", jobId).maybeSingle(),
      supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    ]);
    await notifyBackOffice(supabase, {
      organizationId: organization.id,
      type: "job_alert",
      title: "Problemă raportată",
      body: `${author?.full_name ?? "Tehnicianul"} la lucrarea #${noteJob?.display_number ?? ""} — ${text.slice(0, 140)}`,
      jobId,
    });
  }

  revalidatePath(`/mobil/lucrari/${jobId}/extra`);
  revalidatePath(`/lucrari/${jobId}`);
}

export async function uploadPurchasePhoto(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  const file = formData.get("file") as File | null;
  if (!jobId || !file || file.size === 0) return;

  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${organization.id}/jobs/${jobId}/photos/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(path, file, { contentType: file.type || "image/jpeg" });
  if (uploadError) return;

  await supabase.from("photos").insert({
    organization_id: organization.id,
    job_id: jobId,
    category: "material",
    storage_path: path,
    uploaded_by: userId,
    taken_at: new Date().toISOString(),
  });

  revalidatePath(`/mobil/lucrari/${jobId}`);
}

export async function markPurchaseFulfilled(requestId: string, jobId: string) {
  const supabase = await createClient();
  await supabase
    .from("purchase_requests")
    .update({ fulfilled_at: new Date().toISOString() })
    .eq("id", requestId);

  revalidatePath(`/mobil/lucrari/${jobId}`);
  revalidatePath("/mobil/materiale");
}

export async function acknowledgeRejectedPurchase(requestId: string, jobId: string) {
  const supabase = await createClient();
  await supabase
    .from("purchase_requests")
    .update({ technician_acknowledged_at: new Date().toISOString() })
    .eq("id", requestId);

  revalidatePath(`/mobil/lucrari/${jobId}`);
}

export async function flagClientAbsent(jobId: string) {
  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  const [{ data: job }, { data: profile }] = await Promise.all([
    supabase.from("jobs").select("display_number, title").eq("id", jobId).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
  ]);

  await supabase.from("job_alerts").insert({
    organization_id: organization.id,
    job_id: jobId,
    profile_id: userId,
    kind: "client_absent",
    message: `${profile?.full_name ?? "Tehnicianul"} a finalizat lucrarea #${job?.display_number ?? ""} (${
      job?.title ?? "—"
    }) fără semnătură — clientul nu era prezent.`,
  });
  await notifyBackOffice(supabase, {
    organizationId: organization.id,
    type: "job_alert",
    title: "Client absent",
    body: `Lucrarea #${job?.display_number ?? ""} (${job?.title ?? "—"}) a fost finalizată fără semnătură: clientul nu era prezent.`,
    jobId,
  });

  revalidatePath("/harta");
  revalidatePath("/dashboard");
}

export async function saveSignature(formData: FormData): Promise<SyncResult> {
  const jobId = String(formData.get("jobId") ?? "");
  const signerName = String(formData.get("signerName") ?? "").trim().slice(0, 160);
  const dataUrl = String(formData.get("dataUrl") ?? "");
  if (!jobId || !signerName || !dataUrl.startsWith("data:image/")) return { error: "Semnătura lipsește." };
  if (dataUrl.length > 3_000_000) return { error: "Semnătura e prea mare." };

  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const base64 = dataUrl.split(",")[1];
  const bytes = Buffer.from(base64, "base64");
  // Semnătura luată fără semnal se trimite mai târziu, cu id-ul ei: a doua trimitere nu o dublează.
  const opId = safeOpId(formData.get("opId"));
  const path = `${organization.id}/jobs/${jobId}/signatures/${opId ?? Date.now()}.png`;
  if (opId) {
    const { data: existing } = await supabase.from("signatures").select("id").eq("storage_path", path).limit(1);
    if (existing?.length) return { ok: true };
  }

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(path, bytes, { contentType: "image/png" });
  if (uploadError && !(opId && /exist|duplicate/i.test(uploadError.message))) return { error: "Nu am putut salva semnătura." };

  const { error: insertError } = await supabase.from("signatures").insert({
    organization_id: organization.id,
    job_id: jobId,
    signer_name: signerName,
    signer_role: "client",
    storage_path: path,
    signed_at: acceptClientTime(formData.get("signedAt")),
  });
  if (insertError) return { error: "Nu am putut salva semnătura." };

  paths(jobId);
  revalidatePath(`/mobil/lucrari/${jobId}/semnatura`);
  return { ok: true };
}

/**
 * Sosire / început lucru trimise din aplicație (online sau din coada offline a telefonului).
 * Păstrează ora reală de pe telefon și e sigură la retrimitere. Nu dă statusul lucrării
 * înapoi: dacă lucrarea a trecut deja de pasul ăsta (ex. birou a închis-o), doar notează ora în pontaj.
 */
export async function syncJobEvent(input: { opId: string; jobId: string; event: "arrival" | "work_start"; at: string; lat?: number | null; lng?: number | null; ssm?: { template: string; items: Record<string, boolean>; note?: string } | null }): Promise<SyncResult> {
  if (!UUID.test(String(input?.jobId)) || !safeOpId(input?.opId) || !["arrival", "work_start"].includes(input?.event)) return { error: "Date invalide." };
  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();
  const at = acceptClientTime(input.at);
  const coord = (v: unknown, max: number) => (typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= max ? v : null);

  // Verificarea SSM de dinainte de lucru pleacă împreună cu „Pornește lucrul” (și fără semnal).
  if (input.event === "work_start" && input.ssm && ["electric", "gaze", "fotovoltaic", "general"].includes(input.ssm.template)) {
    const template = input.ssm.template as Template;
    const items = Object.fromEntries(TEMPLATES[template].items.map((i) => [i.id, input.ssm!.items?.[i.id] === true]));
    await supabase.from("ssm_checks").upsert(
      { organization_id: organization.id, job_id: input.jobId, profile_id: userId, template, items, all_ok: checkResult(template, items).allOk, note: (input.ssm.note ?? "").slice(0, 500) || null, checked_at: at },
      { onConflict: "job_id,profile_id,checked_at", ignoreDuplicates: true },
    );
  }

  const { data: already } = await supabase.from("time_entries").select("id").eq("job_id", input.jobId).eq("profile_id", userId).eq("event_type", input.event).eq("occurred_at", at).limit(1);
  if (already?.length) return { ok: true };

  const { data: job } = await supabase.from("jobs").select("id, status").eq("id", input.jobId).eq("organization_id", organization.id).maybeSingle();
  if (!job) return { error: "Lucrarea nu a fost găsită." };

  const before = input.event === "arrival" ? ["programata", "in_drum"] : ["programata", "in_drum", "ajunsa"];
  if (before.includes(job.status)) {
    await supabase
      .from("jobs")
      .update(input.event === "arrival" ? { status: "ajunsa", arrived_at: at } : { status: "in_lucru", work_started_at: at })
      .eq("id", input.jobId)
      .eq("organization_id", organization.id);
  }
  const { error } = await supabase.from("time_entries").insert({
    organization_id: organization.id,
    job_id: input.jobId,
    profile_id: userId,
    event_type: input.event,
    occurred_at: at,
    lat: input.event === "arrival" ? coord(input.lat, 90) : null,
    lng: input.event === "arrival" ? coord(input.lng, 180) : null,
  });
  if (error) return { error: "Nu am putut salva în pontaj." };
  paths(input.jobId);
  return { ok: true };
}
