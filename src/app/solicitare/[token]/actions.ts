"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ipKey } from "@/lib/ip-key";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const MESSAGES: Record<string, string> = {
  invalid: "Scrie numele tău și ce lucrare îți trebuie.",
  contact: "Lasă un telefon sau un e-mail valid, ca firma să te poată contacta.",
  rate_limited: "Ai trimis deja mai multe cereri. Încearcă din nou peste o oră sau sună direct firma.",
  not_found: "Formularul nu mai este activ. Contactează firma direct.",
};

/** Cererea trimisă de client din formularul online al firmei. Nu păstrăm adresa IP, doar un hash pentru limită. */
export async function submitPublicRequest(token: string, _prev: { ok?: boolean; error?: string } | undefined, fd: FormData) {
  if (!UUID.test(token)) return { error: MESSAGES.not_found };
  // Câmp ascuns pentru roboți: un om nu îl completează.
  if (String(fd.get("website") ?? "")) return { ok: true };
  const h = await headers();
  const raw = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "";
  const key = ipKey(raw);
  const ipHash = key ? createHash("sha256").update(`${key}|ef-cereri`).digest("hex").slice(0, 40) : null;
  const date = String(fd.get("preferredDate") ?? "");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_service_request", {
    p_token: token,
    p_name: String(fd.get("name") ?? ""),
    p_phone: String(fd.get("phone") ?? ""),
    p_email: String(fd.get("email") ?? ""),
    p_address: String(fd.get("address") ?? ""),
    p_description: String(fd.get("description") ?? ""),
    p_domain: String(fd.get("domain") ?? ""),
    p_date: ISO.test(date) ? date : null,
    p_window: String(fd.get("window") ?? ""),
    p_ip_hash: ipHash,
  });
  if (error) return { error: "Nu am putut trimite cererea. Încearcă din nou." };
  if (data !== "ok") return { error: MESSAGES[data as string] ?? "Nu am putut trimite cererea." };
  return { ok: true };
}
