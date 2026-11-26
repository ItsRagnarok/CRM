import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Bara de activitate: câți oameni sunt conectați acum pe ElectroField (doar numărul). */
export async function GET() {
  const db = await createClient();
  const { data: claims } = await db.auth.getClaims();
  if (!claims?.claims?.sub) return new Response("Unauthorized", { status: 401 });
  const { data, error } = await db.rpc("ef_platform_online_count");
  if (error) return NextResponse.json({ error: "indisponibil" }, { status: 503 });
  return NextResponse.json({ users: Number(data ?? 0) }, { headers: { "Cache-Control": "no-store" } });
}
