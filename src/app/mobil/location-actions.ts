"use server";

import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";

export async function pingLocation(lat: number, lng: number, accuracyM: number | null) {
  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();
  const now = new Date().toISOString();

  // The live dot (technician_positions) always updates — admins should
  // always see where someone is right now. The trail log only grows while
  // he's actually moving (traveling, idle, etc.); while he's on-site working
  // (in_lucru/pauza) he's stationary by definition, so logging there would
  // just pile up redundant points at the same spot for the whole shift.
  const { data: workingJob } = await supabase
    .from("job_assignments")
    .select("jobs!inner(status)")
    .eq("profile_id", userId)
    .in("jobs.status", ["in_lucru", "pauza"])
    .limit(1)
    .maybeSingle();

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
    // Append-only log so the map can draw the technician's actual route, not
    // just their latest dot — skipped while on-site working (see above).
    workingJob
      ? Promise.resolve()
      : supabase.from("technician_position_log").insert({
          organization_id: organization.id,
          profile_id: userId,
          lat,
          lng,
          recorded_at: now,
        }),
  ]);
}
