import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LeadsBoard } from "./leads-board";

export default async function LeadsPage() {
  await requireAdminContext();
  const db = await createClient({ ignorePreview: true });
  const [leads, events] = await Promise.all([
    db.from("platform_leads").select("*").order("created_at", { ascending: false }).limit(500),
    db.from("platform_lead_events").select("id, lead_id, kind, body, created_at").order("created_at", { ascending: false }).limit(2000),
  ]);
  if (leads.error || events.error) return <p role="alert" className="p-6 text-danger">Nu am putut încărca leadurile. Reîncarcă pagina sau verifică dacă migrarea leads a fost aplicată.</p>;
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" });
  return <LeadsBoard leads={leads.data ?? []} events={events.data ?? []} today={today} />;
}
