"use server";

import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";

export async function registerPushToken(token: string) {
  if (!token) return;
  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  // A device's FCM token is stable per app-install, not per user — if a
  // different technician logs in on the same phone, re-point the same row
  // at their profile instead of leaving a duplicate/stale one behind.
  await supabase.from("device_push_tokens").upsert(
    {
      organization_id: organization.id,
      profile_id: userId,
      platform: "android",
      token,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "token" }
  );
}
