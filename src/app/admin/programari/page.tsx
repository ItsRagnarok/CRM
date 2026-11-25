import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BookingAdmin } from "./booking-admin";

export default async function BookingsPage() {
  await requireAdminContext();
  const db = await createClient({ ignorePreview: true });
  const now = new Date();
  const [settings, days, bookings, past] = await Promise.all([
    db.from("booking_settings").select("*").eq("id", 1).single(),
    db.from("booking_days").select("*"),
    db.from("bookings").select("*").gte("slot_start", now.toISOString()).order("slot_start"),
    db.from("bookings").select("*").lt("slot_start", now.toISOString()).gte("slot_start", new Date(now.getTime() - 90 * 864e5).toISOString()).order("slot_start", { ascending: false }).limit(100),
  ]);
  if (settings.error || days.error || bookings.error || past.error) return <p role="alert" className="p-6 text-danger">Nu am putut încărca programările. Reîncarcă pagina sau verifică permisiunile contului.</p>;
  return <BookingAdmin settings={settings.data} days={days.data ?? []} bookings={bookings.data ?? []} past={past.data ?? []} />;
}
