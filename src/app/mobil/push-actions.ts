"use server";

import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";

export async function registerPushToken(token: string) {
  if (!token) return;
  await requireSessionContext();
  const supabase = await createClient();

  // A device's FCM token is stable per app-install, not per user — if a
  // different person logs in on the same phone, the token moves to them
  // (the database function removes the previous owner's row first).
  const { error } = await supabase.rpc("ef_register_push_token", { p_token: token, p_platform: "android" });
  if (error) console.error("push: registerPushToken failed", error.message);
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
