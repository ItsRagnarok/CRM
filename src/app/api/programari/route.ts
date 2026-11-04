import { createClient } from "@supabase/supabase-js";
import { after, NextRequest, NextResponse } from "next/server";
import { bookingConfirmation, validBookingEmail } from "@/lib/booking-confirmation";
import { confirmBooking, notifyBooking } from "@/lib/booking-email";
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
  after(async () => {
    const sendConfirmation = async () => {
      const { data } = await db.from("booking_settings").select("weekly").eq("id", 1).maybeSingle();
      await confirmBooking(booking, bookingConfirmation(data?.weekly));
    };
    const [alert, confirmation] = await Promise.allSettled([notifyBooking(booking), sendConfirmation()]);
    if (alert.status === "rejected") console.error("Booking alert email failed.");
    if (confirmation.status === "rejected") console.error("Booking confirmation email failed.");
  });
  return NextResponse.json({ booked: true }, { status: 201 });
}
