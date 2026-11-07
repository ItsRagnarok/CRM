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

// Called when someone signs out of the app: that phone must stop receiving
// the previous person's notifications. Only the calling user's own row for
// this exact device token is removed.
export async function unregisterPushToken(token: string) {
  if (!token) return;
  const { userId } = await requireSessionContext();
  const supabase = await createClient();
  await supabase.from("device_push_tokens").delete().eq("token", token).eq("profile_id", userId);
}
