"use server";

import { cookies } from "next/headers";
import { requireAdminContext } from "@/lib/auth";
import { validBookingEmail } from "@/lib/booking-confirmation";
import { confirmBooking } from "@/lib/booking-email";
import { parsePreview, PREVIEW_COOKIE, UUID } from "@/lib/preview";
import { createClient } from "@/lib/supabase/server";

type State = { error?: string; sent?: boolean };

export async function sendPersonalConfirmation(id: string, _state: State, form: FormData): Promise<State> {
  await requireAdminContext();
  if (parsePreview((await cookies()).get(PREVIEW_COOKIE)?.value)) return { error: "Închide vizualizarea companiei înainte de a trimite emailul." };
  if (!UUID.test(id)) return { error: "Programare invalidă." };

  const subject = String(form.get("subject") ?? "").trim();
  const message = String(form.get("message") ?? "").trim();
  const meet = String(form.get("meet") ?? "").trim();
  if (!subject || subject.length > 160 || !message || message.length > 3000) {
    return { error: "Completează subiectul și mesajul." };
  }
  if (meet && !/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}\/?$/i.test(meet)) {
    return { error: "Introdu un link Google Meet valid, de forma https://meet.google.com/abc-defg-hij." };
  }

  const db = await createClient();
  const { data: booking, error } = await db.from("bookings").select("slot_start, name, phone, email")
    .eq("id", id).gte("slot_start", new Date().toISOString()).maybeSingle();
  if (error || !booking?.email || !validBookingEmail(booking.email)) {
    return { error: "Programarea nu mai este disponibilă sau nu are o adresă de email validă." };
  }
  try {
    await confirmBooking(booking, { subject, message }, meet);
    return { sent: true };
  } catch {
    return { error: "Serverul SMTP nu a confirmat trimiterea. Verifică setările de email." };
  }
}
