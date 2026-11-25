import { NextResponse } from "next/server";
import { requireSessionContext, isBackOfficeRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasModule } from "@/lib/modules";
import { buildRegister, registerCsv } from "@/lib/gas-register";

export async function GET(request: Request) {
  const { organization, profile } = await requireSessionContext();
  if (!hasModule(organization.enabled_modules, "scadentar_gaze") || !isBackOfficeRole(profile.role)) return new NextResponse("Interzis", { status: 403 });
  const an = Number(new URL(request.url).searchParams.get("an"));
  const year = Number.isInteger(an) && an >= 2015 && an <= 2100 ? an : new Date().getUTCFullYear();
  const supabase = await createClient();
  const { data } = await supabase
    .from("gas_records")
    .select("kind, number, drawn_up_on, conform, data")
    .eq("organization_id", organization.id)
    .eq("year", year)
    .not("completed_at", "is", null)
    .limit(10000);
  return new NextResponse(registerCsv(buildRegister(data ?? [])), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registru-verificari-revizii-gaze-${year}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
