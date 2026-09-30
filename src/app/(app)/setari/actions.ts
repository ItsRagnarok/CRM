"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";
import type { Database } from "@/lib/supabase/database.types";
import { geocodeAddress } from "@/lib/geocode";

type UserRole = Database["public"]["Enums"]["user_role"];

export async function updateOrganization(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Denumirea companiei este obligatorie." };

  const address = String(formData.get("address") ?? "").trim() || null;
  let hqLat: number | null = organization.hq_lat;
  let hqLng: number | null = organization.hq_lng;
  if (address && address !== organization.address) {
    const coords = await geocodeAddress(address);
    hqLat = coords?.lat ?? null;
    hqLng = coords?.lng ?? null;
  } else if (!address) {
    hqLat = null;
    hqLng = null;
  }

  const { error } = await supabase
    .from("organizations")
    .update({
      name,
      cui: String(formData.get("cui") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      address,
      hq_lat: hqLat,
      hq_lng: hqLng,
    })
    .eq("id", organization.id);

  if (error) return { error: "Nu am putut salva modificările." };

  revalidatePath("/setari");
  return { success: true };
}

export async function createEmployee(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "technician") as UserRole;

  if (!fullName || !email || !password) {
    return { error: "Completează toate câmpurile." };
  }
  if (password.length < 6) {
    return { error: "Parola trebuie să aibă cel puțin 6 caractere." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("company_admin_create_employee", {
    employee_full_name: fullName,
    employee_email: email,
    employee_password: password,
    employee_role: role,
  });

  if (error) {
    return {
      error: error.message.includes("Există deja") || error.message.includes("Clienții")
        ? error.message
        : "Nu am putut crea contul. Încearcă din nou.",
    };
  }

  revalidatePath("/setari");
  revalidatePath("/echipe");
  return { success: true };
}

export async function updateUserRole(formData: FormData) {
  const profileId = String(formData.get("profileId") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;
  if (!profileId || !role) return;

  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  await supabase
    .from("profiles")
    .update({ role })
    .eq("id", profileId)
    .eq("organization_id", organization.id);

  revalidatePath("/setari");
}

export async function updateGpsSettings(formData: FormData) {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const retentionDays = Number(formData.get("retentionDays"));

  await supabase
    .from("organizations")
    .update({
      gps_continuous_tracking_enabled: formData.get("continuousTracking") === "on",
      ...(Number.isFinite(retentionDays) && retentionDays > 0 ? { gps_retention_days: retentionDays } : {}),
    })
    .eq("id", organization.id);

  revalidatePath("/setari");
}
