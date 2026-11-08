import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BookingAdmin } from "./booking-admin";

export default async function BookingsPage() {
  await requireAdminContext();
  const db = await createClient({ ignorePreview: true });
  const [settings, days, bookings] = await Promise.all([
    db.from("booking_settings").select("*").eq("id", 1).single(),
    db.from("booking_days").select("*"),
    db.from("bookings").select("*").gte("slot_start", new Date().toISOString()).order("slot_start"),
  ]);
  if (settings.error || days.error || bookings.error) return <p role="alert" className="p-6 text-danger">Nu am putut încărca programările. Reîncarcă pagina sau verifică permisiunile contului.</p>;
  const mailConfigured = Boolean(process.env.BOOKING_SMTP_HOST && process.env.BOOKING_SMTP_PASSWORD);
  return (
    <>
      {!mailConfigured && (
        <div role="alert" className="mx-auto mt-4 max-w-4xl rounded-xl border border-warning/40 bg-warning-bg p-4 text-sm text-warning">
          <b>Emailurile de programare nu sunt configurate.</b> Programările se salvează, dar nu primești alertă pe email și clientul nu primește confirmare automată.
          Adaugă în Vercel (Environment Variables, Production) variabilele <code>BOOKING_SMTP_HOST</code>, <code>BOOKING_SMTP_USER</code> și <code>BOOKING_SMTP_PASSWORD</code> pentru căsuța programare@. Confirmările personale, trimise de aici, merg dacă adresa e conectată în Mail.
        </div>
      )}
      <BookingAdmin settings={settings.data} days={days.data ?? []} bookings={bookings.data ?? []} />
    </>
  );
}
