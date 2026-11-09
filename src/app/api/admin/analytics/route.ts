import { NextRequest, NextResponse } from "next/server";
import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const PERIODS = ["24h", "today", "yesterday", "7d", "30d", "custom"];
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  await requireAdminContext();
  const q = request.nextUrl.searchParams;
  const period = PERIODS.includes(q.get("period") ?? "") ? q.get("period")! : "24h";
  const from = q.get("from") ?? "";
  const to = q.get("to") ?? "";
  if (period === "custom" && (!DAY.test(from) || !DAY.test(to) || to < from)) return NextResponse.json({ error: "Interval invalid. Alege o dată de început și una de sfârșit, în această ordine." }, { status: 400 });
  const db = await createClient({ ignorePreview: true });
  const { data, error } = await db.rpc("ef_site_stats", { p_period: period, ...(period === "custom" ? { p_from: from, p_to: to } : {}) });
  if (error) return NextResponse.json({ error: error.code === "22023" ? "Intervalul poate avea cel mult 365 de zile." : "Analiticele nu au putut fi încărcate." }, { status: 400 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
