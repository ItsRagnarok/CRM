import { NextResponse } from "next/server";
import { requireSessionContext, isBackOfficeRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { marketingCsv } from "@/lib/contact-prefs";

/** Lista clienților activi care au acceptat oferte, doar cu datele canalelor acceptate. */
export async function GET() {
  const { organization, profile } = await requireSessionContext();
  if (!isBackOfficeRole(profile.role)) return new NextResponse("Interzis", { status: 403 });
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("name, phone, email, marketing_channels, contact_prefs_updated_at")
    .eq("organization_id", organization.id)
    .eq("status", "active")
    .filter("marketing_channels", "neq", "{}")
    .order("name")
    .limit(10000);
  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(marketingCsv(data ?? []), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clienti-cu-acord-oferte-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
