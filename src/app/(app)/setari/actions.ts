"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";
import type { Database } from "@/lib/supabase/database.types";

type UserRole = Database["public"]["Enums"]["user_role"];

export async function updateOrganization(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Denumirea companiei este obligatorie." };

  const { error } = await supabase
    .from("organizations")
    .update({
      name,
      cui: String(formData.get("cui") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
    })
    .eq("id", organization.id);

  if (error) return { error: "Nu am putut salva modificările." };

  revalidatePath("/setari");
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

  await supabase
    .from("organizations")
    .update({
      gps_continuous_tracking_enabled: formData.get("continuousTracking") === "on",
    })
    .eq("id", organization.id);

  revalidatePath("/setari");
}
