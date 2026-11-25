"use server";

import { createClient } from "@/lib/supabase/server";
import { isChannel, normMarketing } from "@/lib/contact-prefs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Clientul alege singur, de pe linkul de status, cum e anunțat și dacă primește oferte. */
export async function saveStatusPrefs(token: string, fd: FormData): Promise<{ ok?: boolean; error?: string }> {
  if (!UUID.test(token)) return { error: "Linkul nu mai este valabil." };
  const channel = String(fd.get("channel") ?? "");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_status_prefs", {
    p_token: token,
    p_channel: isChannel(channel) ? channel : null,
    p_marketing: normMarketing(fd.getAll("marketing")),
  });
  if (error) return { error: "Nu am putut salva. Încercați din nou." };
  if (data === "rate_limited") return { error: "Prea multe modificări într-o oră. Încercați mai târziu." };
  if (data !== "ok") return { error: "Linkul nu mai este valabil." };
  return { ok: true };
}
