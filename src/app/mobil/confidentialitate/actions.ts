"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";

export async function grantLocationConsent() {
  const { profile } = await requireSessionContext();
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ location_consent_at: new Date().toISOString(), location_consent_revoked_at: null })
    .eq("id", profile.id);
  revalidatePath("/mobil/confidentialitate");
  revalidatePath("/mobil");
}

export async function revokeLocationConsent() {
  const { profile } = await requireSessionContext();
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ location_consent_at: null, location_consent_revoked_at: new Date().toISOString() })
    .eq("id", profile.id);
  revalidatePath("/mobil/confidentialitate");
  revalidatePath("/mobil");
}
