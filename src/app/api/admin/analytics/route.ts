import { NextRequest, NextResponse } from "next/server";
import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await requireAdminContext();
  const period = ["24h", "7d", "30d"].includes(request.nextUrl.searchParams.get("period") ?? "") ? request.nextUrl.searchParams.get("period")! : "24h";
  const db = await createClient({ ignorePreview: true });
  const { data, error } = await db.rpc("ef_site_analytics", { p_period: period });
  if (error) return NextResponse.json({ error: "Analiticele nu au putut fi încărcate." }, { status: 500 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
