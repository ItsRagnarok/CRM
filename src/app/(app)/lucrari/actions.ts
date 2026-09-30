"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";
import type { Database } from "@/lib/supabase/database.types";
import { syncJobAssignmentsToTeam } from "./team-sync";
import { geocodeAddress } from "@/lib/geocode";
import { todayInOrgTimeZone, nowTimeInOrgTimeZone } from "@/lib/date";
import { ensureChecklist } from "./[id]/actions";

type JobStatus = Database["public"]["Enums"]["job_status"];
type JobType = Database["public"]["Enums"]["job_type"];
type JobPriority = Database["public"]["Enums"]["job_priority"];

export async function createJob(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  const clientId = String(formData.get("clientId") ?? "");
  const teamId = String(formData.get("teamId") ?? "") || null;
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const adminMessage = String(formData.get("adminMessage") ?? "").trim() || null;
  const jobType = String(formData.get("jobType") ?? "interventie") as JobType;
  const priority = String(formData.get("priority") ?? "normala") as JobPriority;
  const scheduledDate = String(formData.get("scheduledDate") ?? "") || todayInOrgTimeZone();
  const startTime = String(formData.get("startTime") ?? "") || nowTimeInOrgTimeZone();
  const DEFAULT_END_TIME = "20:00";
  const endTime = String(formData.get("endTime") ?? "") || (startTime < DEFAULT_END_TIME ? DEFAULT_END_TIME : "23:59");
  const address = String(formData.get("address") ?? "").trim();
  const existingLocationId = String(formData.get("locationId") ?? "").trim() || null;
  const requireArrivalPhoto = formData.get("requireArrivalPhoto") === "on";
  const requireDuringPhoto = formData.get("requireDuringPhoto") === "on";
  const requireFinalPhoto = formData.get("requireFinalPhoto") === "on";
  const photoGuidanceBefore = String(formData.get("photoGuidanceBefore") ?? "").trim() || null;
  const photoGuidanceDuring = String(formData.get("photoGuidanceDuring") ?? "").trim() || null;
  const photoGuidanceAfter = String(formData.get("photoGuidanceAfter") ?? "").trim() || null;

  if (!clientId || !title) {
    return { error: "Client și titlu sunt obligatorii." };
  }

  let locationId: string | null = null;
  if (existingLocationId) {
    // Trust nothing from the client past this check: confirm the location
    // actually belongs to this org and this client before attaching it.
    const { data: ownedLocation } = await supabase
      .from("locations")
      .select("id")
      .eq("id", existingLocationId)
      .eq("organization_id", organization.id)
      .eq("client_id", clientId)
      .maybeSingle();
    locationId = ownedLocation?.id ?? null;
  }
  if (!locationId && address) {
    const coords = await geocodeAddress(address);
    const { data: location } = await supabase
      .from("locations")
      .insert({
        organization_id: organization.id,
        client_id: clientId,
        address,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      })
      .select("id")
      .single();
    locationId = location?.id ?? null;
  }

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      organization_id: organization.id,
      client_id: clientId,
      team_id: teamId,
      location_id: locationId,
      title,
      description,
      admin_message: adminMessage,
      job_type: jobType,
      priority,
      scheduled_date: scheduledDate,
      start_time: startTime,
      end_time: endTime,
      created_by: userId,
      require_arrival_photo: requireArrivalPhoto,
      require_during_photo: requireDuringPhoto,
      require_final_photo: requireFinalPhoto,
      photo_guidance_before: photoGuidanceBefore,
      photo_guidance_during: photoGuidanceDuring,
      photo_guidance_after: photoGuidanceAfter,
    })
    .select("id")
    .single();

  if (error || !job) {
    return { error: "Nu am putut crea lucrarea. Încearcă din nou." };
  }

  await supabase.from("job_status_history").insert({
    job_id: job.id,
    status: "programata",
    changed_by: userId,
  });

  await syncJobAssignmentsToTeam(supabase, job.id, teamId);

  const requiredMaterialIds = formData.getAll("requiredMaterialIds").map(String).filter(Boolean);
  if (requiredMaterialIds.length > 0) {
    const { data: chosenMaterials } = await supabase
      .from("materials")
      .select("id, kind")
      .eq("organization_id", organization.id)
      .in("id", requiredMaterialIds);

    if (chosenMaterials && chosenMaterials.length > 0) {
      await supabase.from("job_required_items").insert(
        chosenMaterials.map((m) => ({
          organization_id: organization.id,
          job_id: job.id,
          kind: m.kind,
          material_id: m.id,
          quantity_needed: 1,
          created_by: userId,
        }))
      );
    }
  }

  // AI-suggested materials/tools that don't match anything in the catalog —
  // added as free-text items rather than silently dropped or forcing the
  // admin to create catalog entries before the job can reflect them.
  const customItemsRaw = String(formData.get("customRequiredItems") ?? "");
  if (customItemsRaw) {
    try {
      const customItems = JSON.parse(customItemsRaw) as { name?: string; quantity?: number; kind?: string }[];
      const validItems = customItems.filter((i) => i.name && i.name.trim());
      if (validItems.length > 0) {
        await supabase.from("job_required_items").insert(
          validItems.map((i) => ({
            organization_id: organization.id,
            job_id: job.id,
            kind: i.kind === "tool" ? "tool" : "material",
            custom_name: i.name!.trim(),
            quantity_needed: Math.max(1, Number(i.quantity) || 1),
            created_by: userId,
          }))
        );
      }
    } catch {
      // Malformed JSON from the client — not worth failing job creation over.
    }
  }

  // AI-suggested step-by-step checklist, seeded the same way an admin
  // checklist template would be — locked so the technician can only check
  // them off, matching ensureChecklist's existing convention for
  // template-seeded items.
  const aiStepsRaw = String(formData.get("aiChecklistSteps") ?? "");
  if (aiStepsRaw) {
    try {
      const steps = (JSON.parse(aiStepsRaw) as unknown[])
        .map((s) => String(s ?? "").trim())
        .filter(Boolean);
      if (steps.length > 0) {
        const checklistId = await ensureChecklist(supabase, job.id, "after");
        if (checklistId) {
          await supabase.from("job_checklist_items").insert(
            steps.map((label, i) => ({
              job_checklist_id: checklistId,
              label,
              sort_order: i,
              locked: true,
            }))
          );
        }
      }
    } catch {
      // Malformed JSON from the client — not worth failing job creation over.
    }
  }

  revalidatePath("/lucrari");
  revalidatePath("/dashboard");
  revalidatePath("/mobil/materiale");
  revalidatePath("/mobil");
  revalidatePath("/mobil/lucrari");
  redirect(`/lucrari/${job.id}`);
}

export async function updateJobStatus(jobId: string, status: JobStatus) {
  const { userId } = await requireSessionContext();
  const supabase = await createClient();

  const timestampField =
    status === "ajunsa"
      ? { arrived_at: new Date().toISOString() }
      : status === "in_lucru"
        ? { work_started_at: new Date().toISOString() }
        : status === "finalizata"
          ? { work_ended_at: new Date().toISOString() }
          : {};

  await supabase
    .from("jobs")
    .update({ status, ...timestampField })
    .eq("id", jobId);

  await supabase.from("job_status_history").insert({
    job_id: jobId,
    status,
    changed_by: userId,
  });

  revalidatePath(`/lucrari/${jobId}`);
  revalidatePath("/lucrari");
  revalidatePath("/dashboard");
}
