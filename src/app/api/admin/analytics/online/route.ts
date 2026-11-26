import { NextResponse } from "next/server";
import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Cine e online acum pe site (ultimele 5 minute), cu drumul fiecăruia, plus câte vizite automate au fost. */
export async function GET() {
  await requireAdminContext();
  const db = await createClient({ ignorePreview: true });
  const { data, error } = await db.rpc("ef_site_online");
  if (error) return NextResponse.json({ error: "Nu am putut încărca vizitatorii online." }, { status: 400 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
