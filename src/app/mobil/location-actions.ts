"use server";

import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";

export async function pingLocation(lat: number, lng: number, accuracyM: number | null) {
  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();
  const now = new Date().toISOString();

  await Promise.all([
    supabase.from("technician_positions").upsert({
      profile_id: userId,
      organization_id: organization.id,
      lat,
      lng,
      accuracy_m: accuracyM,
      recorded_at: now,
      updated_at: now,
    }),
    // Append-only log so the admin map can draw the technician's actual
    // route, not just their latest dot.
    supabase.from("technician_position_log").insert({
      organization_id: organization.id,
      profile_id: userId,
      lat,
      lng,
      recorded_at: now,
    }),
  ]);
}
