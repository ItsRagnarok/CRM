import { createClient } from "@supabase/supabase-js";
import { after, NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import type { Database } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const maxDuration = 30;

const recipient = "programare@electrofield.ro";

async function notifyBooking(booking: Database["public"]["Tables"]["bookings"]["Insert"]) {
  const host = process.env.BOOKING_SMTP_HOST;
  const password = process.env.BOOKING_SMTP_PASSWORD;
  if (!host || !password) {
    console.warn("Booking email SMTP is not configured.");
    return;
  }
  const sender = process.env.BOOKING_SMTP_USER || recipient;
  const transport = nodemailer.createTransport({
    host, port: 465, secure: true,
    auth: { user: sender, pass: password },
    connectionTimeout: 8_000, greetingTimeout: 8_000, socketTimeout: 10_000,
  });
  const slot = new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "full", timeStyle: "short", timeZone: "Europe/Bucharest",
  }).format(new Date(booking.slot_start));

  try {
    const result = await transport.sendMail({
      from: { name: "ElectroField Programări", address: sender },
      to: recipient,
      subject: `Programare nouă ElectroField · ${slot}`,
      text: [
        `Programare: ${slot} (ora României)`,
        `Nume: ${booking.name}`,
        `Telefon: ${booking.phone}`,
        booking.email && `Email: ${booking.email}`,
        booking.note && `Mesaj: ${booking.note}`,
      ].filter(Boolean).join("\n"),
    });
    if (!result.accepted.length) console.warn("Booking email recipient was not accepted.");
  } catch {
    console.error("Booking email delivery failed.");
  } finally {
    transport.close();
  }
}

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
      email.length > 254 || note.length > 2_000 || !Number.isFinite(when.getTime())) {
    return new Response(null, { status: 400 });
  }

  // Use the public role so the existing booking policies and slot trigger apply.
  const db = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const booking = { slot_start: when.toISOString(), name, phone, email: email || null, note: note || null };
  const { error } = await db.from("bookings").insert(booking);
  if (error) {
    return new Response(null, { status: error.code === "23505" || error.code === "23514" ? 409 : 500 });
  }
  after(() => notifyBooking(booking));
  return NextResponse.json({ booked: true }, { status: 201 });
}
