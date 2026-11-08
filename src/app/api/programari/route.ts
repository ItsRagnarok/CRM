import { createClient } from "@supabase/supabase-js";
import { after, NextRequest, NextResponse } from "next/server";
import { validBookingEmail } from "@/lib/booking-confirmation";
import { notifyBooking } from "@/lib/booking-email";
import type { Database } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return new Response(null, { status: 403 });
  const body = await request.text();
  if (body.length > 8_192) return new Response(null, { status: 413 });

  let fields: Record<string, unknown>;
  try {
    fields = JSON.parse(body);
  } catch {
    return new Response(null, { status: 400 });
  }
  const value = (key: string) => typeof fields?.[key] === "string" ? fields[key].trim() : "";
  const name = value("name");
  const phone = value("phone");
  const email = value("email");
  const note = value("note");
  const when = new Date(value("slot_start"));
  if (!name || name.length > 120 || !phone || phone.length > 40 ||
      !validBookingEmail(email) || note.length > 2_000 || !Number.isFinite(when.getTime())) {
    return new Response(null, { status: 400 });
  }

  // Use the public role so the existing booking policies and slot trigger apply.
  const db = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const booking = { slot_start: when.toISOString(), name, phone, email, note: note || null };
  const { error } = await db.from("bookings").insert(booking);
  if (error) {
    return new Response(null, { status: error.code === "23505" || error.code === "23514" ? 409 : 500 });
  }
  // The client confirmation is sent by hand from Super Admin → Programări, never automatically.
  // The internal alert only runs when the booking mailbox is configured.
  if (process.env.BOOKING_SMTP_HOST && process.env.BOOKING_SMTP_PASSWORD) {
    after(async () => {
      try {
        await notifyBooking(booking);
      } catch {
        console.error("Booking alert email failed.");
      }
    });
  }
  return NextResponse.json({ booked: true }, { status: 201 });
}
