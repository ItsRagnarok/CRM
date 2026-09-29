"use server";

import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";

export async function pingLocation(lat: number, lng: number, accuracyM: number | null) {
  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  await supabase.from("technician_positions").upsert({
    profile_id: userId,
    organization_id: organization.id,
    lat,
    lng,
    accuracy_m: accuracyM,
    recorded_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}
