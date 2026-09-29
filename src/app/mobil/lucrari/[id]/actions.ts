"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";
import { mobileStagePath, type MobileStage } from "./mobile-stage";

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
      await supabase.from("notifications").insert(
        admins.map((a) => ({
          organization_id: organization.id,
          profile_id: a.id,
          type: "job_started",
          title: "Lucrare pornită",
          body: `${profile.full_name} a pornit lucrarea #${job.display_number} — ${job.title}`,
          related_job_id: jobId,
        }))
      );
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
  const observations = String(formData.get("observations") ?? "").trim();
  const equipmentIssue = String(formData.get("equipmentIssue") ?? "").trim();
  if (!jobId) return;

  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();
  const now = new Date().toISOString();

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

  paths(jobId);
  revalidatePath(`/mobil/lucrari/${jobId}/finalizare`);
  redirect(`/mobil/lucrari/${jobId}/semnatura`);
}

export async function uploadJobPhoto(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  const category = String(formData.get("category") ?? "in_timpul");
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
    category,
    storage_path: path,
    uploaded_by: userId,
    taken_at: new Date().toISOString(),
  });

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

  revalidatePath("/harta");
  revalidatePath("/dashboard");
}

export async function saveSignature(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  const signerName = String(formData.get("signerName") ?? "").trim();
  const dataUrl = String(formData.get("dataUrl") ?? "");
  if (!jobId || !signerName || !dataUrl.startsWith("data:image/")) return;

  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const base64 = dataUrl.split(",")[1];
  const bytes = Buffer.from(base64, "base64");
  const path = `${organization.id}/jobs/${jobId}/signatures/${Date.now()}.png`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(path, bytes, { contentType: "image/png" });
  if (uploadError) return;

  await supabase.from("signatures").insert({
    organization_id: organization.id,
    job_id: jobId,
    signer_name: signerName,
    signer_role: "client",
    storage_path: path,
    signed_at: new Date().toISOString(),
  });

  paths(jobId);
  revalidatePath(`/mobil/lucrari/${jobId}/semnatura`);
}
