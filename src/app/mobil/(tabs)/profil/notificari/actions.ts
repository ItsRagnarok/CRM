"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";
import { notifyProfiles, type PrefKey } from "@/lib/notify";
import type { PushResult } from "@/lib/push";

const KEYS: PrefKey[] = ["messages", "calls", "jobs", "purchases"];

export async function setNotificationPref(key: PrefKey, enabled: boolean): Promise<{ error?: string }> {
  if (!KEYS.includes(key)) return { error: "Preferință necunoscută." };
  const { profile } = await requireSessionContext();
  const supabase = await createClient();

  // Read-modify-write: a person only toggles their own switches one at a time.
  const { data: current } = await supabase.from("profiles").select("notification_prefs").eq("id", profile.id).single();
  const prefs = { ...((current?.notification_prefs as Record<string, boolean> | null) ?? {}), [key]: enabled };

  const { error } = await supabase.from("profiles").update({ notification_prefs: prefs }).eq("id", profile.id);
  if (error) return { error: "Nu am putut salva preferința." };
  revalidatePath("/mobil/profil/notificari");
  return {};
}

// Sends a real notification (bell entry + system push) to the caller's own
// devices and reports exactly what happened, so "do notifications work on
// this phone?" has a concrete answer instead of silence.
export async function sendTestNotification(): Promise<PushResult> {
  const { organization, profile } = await requireSessionContext();
  const supabase = await createClient();
  const result = await notifyProfiles(supabase, {
    organizationId: organization.id,
    profileIds: [profile.id],
    type: "test",
    title: "Notificare de test",
    body: "Funcționează! Dacă o vezi cu aplicația închisă, notificările sunt în regulă.",
    link: "/mobil/notificari",
  });
  revalidatePath("/mobil");
  return result;
}
