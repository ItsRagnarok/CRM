"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";

export async function createTeam(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Numele echipei este obligatoriu." };
  }

  const { data: team, error } = await supabase
    .from("teams")
    .insert({ organization_id: organization.id, name })
    .select("id")
    .single();

  if (error || !team) {
    return { error: "Nu am putut crea echipa. Încearcă din nou." };
  }

  revalidatePath("/echipe");
  redirect(`/echipe/${team.id}`);
}

export async function toggleTeamActive(formData: FormData) {
  const teamId = String(formData.get("teamId") ?? "");
  const currentStatus = String(formData.get("currentStatus") ?? "true") === "true";
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  await supabase
    .from("teams")
    .update({ is_active: !currentStatus })
    .eq("id", teamId)
    .eq("organization_id", organization.id);

  revalidatePath(`/echipe/${teamId}`);
  revalidatePath("/echipe");
}

export async function addMember(formData: FormData) {
  const teamId = String(formData.get("teamId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  if (!teamId || !profileId) return;

  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  // Confirm the profile actually belongs to this org before attaching it.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!profile) return;

  await supabase.from("team_members").insert({ team_id: teamId, profile_id: profileId });
  revalidatePath(`/echipe/${teamId}`);
  revalidatePath("/echipe");
}

export async function removeMember(formData: FormData) {
  const teamId = String(formData.get("teamId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  if (!teamId || !profileId) return;

  const supabase = await createClient();

  await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("profile_id", profileId);

  // A team leader who's no longer a member can't stay the leader.
  await supabase
    .from("teams")
    .update({ team_leader_id: null })
    .eq("id", teamId)
    .eq("team_leader_id", profileId);

  revalidatePath(`/echipe/${teamId}`);
  revalidatePath("/echipe");
}

export async function setTeamLeader(formData: FormData) {
  const teamId = String(formData.get("teamId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  if (!teamId || !profileId) return;

  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  await supabase
    .from("teams")
    .update({ team_leader_id: profileId })
    .eq("id", teamId)
    .eq("organization_id", organization.id);

  revalidatePath(`/echipe/${teamId}`);
  revalidatePath("/echipe");
}

export async function reassignVehicle(formData: FormData) {
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const teamId = String(formData.get("teamId") ?? "").trim() || null;
  if (!vehicleId) return;

  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  await supabase
    .from("vehicles")
    .update({ assigned_team_id: teamId })
    .eq("id", vehicleId)
    .eq("organization_id", organization.id);

  revalidatePath("/echipe");
  if (teamId) revalidatePath(`/echipe/${teamId}`);
}

export async function setVehicleDriver(formData: FormData) {
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const driverId = String(formData.get("driverId") ?? "").trim() || null;
  if (!vehicleId) return;

  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  await supabase
    .from("vehicles")
    .update({ driver_id: driverId })
    .eq("id", vehicleId)
    .eq("organization_id", organization.id);

  revalidatePath("/echipe");
}

export async function addVehicle(formData: FormData) {
  const teamId = String(formData.get("teamId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const plateNumber = String(formData.get("plateNumber") ?? "").trim() || null;
  if (!teamId || !name) return;

  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  await supabase.from("vehicles").insert({
    organization_id: organization.id,
    assigned_team_id: teamId,
    name,
    plate_number: plateNumber,
  });

  revalidatePath(`/echipe/${teamId}`);
}

export async function removeVehicle(formData: FormData) {
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  if (!vehicleId) return;

  const supabase = await createClient();

  const { count } = await supabase
    .from("material_stock")
    .select("id", { count: "exact", head: true })
    .eq("vehicle_id", vehicleId);

  if (count && count > 0) {
    // Has stock tracked against it — unassign from the team instead of
    // deleting the vehicle out from under that inventory.
    await supabase.from("vehicles").update({ assigned_team_id: null }).eq("id", vehicleId);
  } else {
    await supabase.from("vehicles").delete().eq("id", vehicleId);
  }

  revalidatePath(`/echipe/${teamId}`);
}
