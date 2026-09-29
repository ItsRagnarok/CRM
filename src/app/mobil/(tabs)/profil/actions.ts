"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";

export async function toggleNotifications(formData: FormData) {
  const enabled = formData.get("enabled") === "on";
  const { profile } = await requireSessionContext();
  const supabase = await createClient();

  await supabase.from("profiles").update({ notifications_enabled: enabled }).eq("id", profile.id);

  revalidatePath("/mobil/profil");
}
