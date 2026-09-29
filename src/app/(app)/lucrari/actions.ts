"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";
import type { Database } from "@/lib/supabase/database.types";
import { syncJobAssignmentsToTeam } from "./team-sync";

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
  const jobType = String(formData.get("jobType") ?? "interventie") as JobType;
  const priority = String(formData.get("priority") ?? "normala") as JobPriority;
  const scheduledDate = String(formData.get("scheduledDate") ?? "");
  const startTime = String(formData.get("startTime") ?? "") || null;
  const endTime = String(formData.get("endTime") ?? "") || null;
  const address = String(formData.get("address") ?? "").trim();
  const existingLocationId = String(formData.get("locationId") ?? "").trim() || null;

  if (!clientId || !title || !scheduledDate) {
    return { error: "Client, titlu și dată sunt obligatorii." };
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
    const { data: location } = await supabase
      .from("locations")
      .insert({
        organization_id: organization.id,
        client_id: clientId,
        address,
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
      job_type: jobType,
      priority,
      scheduled_date: scheduledDate,
      start_time: startTime,
      end_time: endTime,
      created_by: userId,
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
