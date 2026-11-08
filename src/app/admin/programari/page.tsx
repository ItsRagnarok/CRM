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
  return <BookingAdmin settings={settings.data} days={days.data ?? []} bookings={bookings.data ?? []} />;
}
