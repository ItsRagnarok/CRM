"use server";

import { randomInt } from "node:crypto";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendBookingEmail } from "@/lib/booking-email";
import { SITE_URL } from "@/lib/seo";
import { SUPPORT_EMAIL } from "@/lib/contact";
import type { Database } from "@/lib/supabase/database.types";

type State = { error?: string; success?: string } | undefined;

// Readable alphabet (no 0/O, 1/l/I) so the temporary password can be typed from an email.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
function temporaryPassword() {
  const pick = (n: number) => Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${pick(5)}-${pick(5)}-${pick(5)}-${pick(5)}`;
}

/** Confirms the signed-in admin knows their current password, without touching their session. */
async function passwordMatches(email: string, password: string) {
  const plain = createPlainClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error } = await plain.auth.signInWithPassword({ email, password });
  return !error;
}

export async function changeAdminPassword(_prev: State, formData: FormData): Promise<State> {
  const { email } = await requireAdminContext();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const repeat = String(formData.get("repeat") ?? "");
  if (!email || !current) return { error: "Introdu parola curentă." };
  if (next.length < 12) return { error: "Parola nouă trebuie să aibă cel puțin 12 caractere." };
  if (next !== repeat) return { error: "Parolele noi nu coincid." };
  if (next === current) return { error: "Parola nouă trebuie să fie diferită de cea curentă." };
  if (!(await passwordMatches(email, current))) return { error: "Parola curentă nu este corectă." };

  const supabase = await createClient({ ignorePreview: true });
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: "Nu am putut schimba parola. Încearcă din nou." };
  return { success: "Parola a fost schimbată." };
}

export async function transferSuperAdmin(_prev: State, formData: FormData): Promise<State> {
  const { email } = await requireAdminContext();
  const newEmail = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const current = String(formData.get("current") ?? "");
  const confirmEmail = String(formData.get("confirmEmail") ?? "").trim().toLowerCase();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) return { error: "Adresa de email nu este validă." };
  if (!fullName) return { error: "Completează numele noului administrator." };
  if (confirmEmail !== newEmail) return { error: "Confirmarea adresei nu coincide." };
  if (!email || !current || !(await passwordMatches(email, current))) return { error: "Parola ta curentă nu este corectă." };

  const supabase = await createClient({ ignorePreview: true });
  const password = temporaryPassword();
  const { data: newId, error } = await supabase.rpc("platform_admin_transfer_begin", {
    new_email: newEmail,
    new_full_name: fullName,
    temp_password: password,
  });
  if (error || !newId) {
    return { error: error?.message.includes("Există deja") ? error.message : "Nu am putut crea noul cont. Încearcă din nou." };
  }

  const loginUrl = `${SITE_URL}/login`;
  const text = [
    `Bună, ${fullName},`,
    "",
    "Ai primit rolul de Super Admin în platforma ElectroField.",
    "",
    `Adresă de conectare: ${loginUrl}`,
    `Email: ${newEmail}`,
    `Parolă temporară: ${password}`,
    "",
    "După prima conectare, schimbă parola din Super Admin → Cont.",
    "Dacă nu te așteptai la acest mesaj, nu folosi parola și răspunde la acest email.",
  ].join("\n");
  const html = `<!doctype html><html lang="ro"><body style="margin:0;padding:24px;background:#f4f5fb;color:#19223a;font-family:Arial,sans-serif"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e3e7f3;border-radius:14px"><div style="padding:20px 24px;background:#0c110f;color:#c6ff4a;border-radius:14px 14px 0 0;font-size:19px;font-weight:bold">ElectroField</div><div style="padding:24px;font-size:15px;line-height:1.6"><h1 style="margin:0 0 14px;font-size:22px">Acces Super Admin</h1><p>Bună, ${fullName.replace(/[<>&"']/g, "")},</p><p>Ai primit rolul de Super Admin în platforma ElectroField.</p><p style="padding:14px;background:#f0f5e4;border-radius:8px;font-family:monospace;font-size:15px">Email: ${newEmail}<br>Parolă temporară: <strong>${password}</strong></p><p><a href="${loginUrl}" style="display:inline-block;background:#c6ff4a;color:#0a0d0a;padding:10px 18px;border-radius:99px;text-decoration:none;font-weight:bold">Conectează-te</a></p><p>După prima conectare, schimbă parola din <strong>Super Admin → Cont</strong>.</p><p style="color:#667085;font-size:13px">Dacă nu te așteptai la acest mesaj, nu folosi parola și răspunde la acest email.</p></div></div></body></html>`;

  try {
    await sendBookingEmail(newEmail, "Acces Super Admin ElectroField", text, html, undefined, SUPPORT_EMAIL);
  } catch {
    // Nobody received the password: undo, so the platform is never left without a reachable admin.
    await supabase.rpc("platform_admin_transfer_cancel", { new_admin_id: newId });
    return { error: "Emailul cu parola temporară nu a putut fi trimis, deci transferul a fost anulat. Verifică setările SMTP și încearcă din nou." };
  }

  const { error: finishError } = await supabase.rpc("platform_admin_transfer_finish", { new_admin_id: newId });
  if (finishError) {
    return { error: "Contul nou a primit parola, dar rolul tău nu a putut fi retras. Ești încă Super Admin; ambele conturi au acces până rezolvi." };
  }
  await supabase.auth.signOut();
  redirect("/login");
}
