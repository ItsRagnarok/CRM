"use server";

import { revalidatePath } from "next/cache";
import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { compactForAi, ruleRecommendations, summarize, INSIGHT_PERIODS, type InsightPeriod, type StatsInput } from "@/lib/site-insights";
import { aiRecommendations } from "@/lib/site-insights-ai";

export type InsightRow = {
  id: string; period: InsightPeriod; created_at: string;
  summary: Record<string, unknown>; rules: unknown; ai: unknown; ai_model: string | null; ai_error: string | null; applied: unknown;
};

/** Analizează perioada aleasă: reguli + AI, și păstrează rezultatul în istoric. */
export async function runSiteAnalysis(period: InsightPeriod): Promise<{ row?: InsightRow; error?: string }> {
  const ctx = await requireAdminContext();
  if (!INSIGHT_PERIODS.some((p) => p.id === period)) return { error: "Perioadă necunoscută." };
  const db = await createClient({ ignorePreview: true });
  const { data, error } = await db.rpc("ef_site_stats", { p_period: period });
  if (error || !data) return { error: "Nu am putut citi analiticele." };
  const stats = data as unknown as StatsInput;
  const rules = ruleRecommendations(stats, period);
  const summary = summarize(stats);
  const ai = stats.visitors > 0 ? await aiRecommendations(compactForAi(stats, period)) : { error: "Fără vizitatori în perioadă: nu e nimic de analizat cu AI." };
  const { data: row, error: insErr } = await db
    .from("site_insights")
    .insert({
      period,
      created_by: ctx.userId,
      summary: { ...summary, aiSummary: "summary" in ai ? ai.summary : null, aiRejected: "rejected" in ai ? ai.rejected : [] },
      rules,
      ai: "recommendations" in ai ? ai.recommendations : null,
      ai_model: "model" in ai ? ai.model : null,
      ai_error: "error" in ai ? ai.error : null,
    })
    .select("*")
    .single();
  if (insErr || !row) return { error: "Analiza s-a făcut, dar nu am putut-o salva." };
  revalidatePath("/admin/analitice");
  return { row: row as unknown as InsightRow };
}

/** Bifează / debifează o recomandare ca aplicată. */
export async function toggleApplied(id: string, recId: string, on: boolean): Promise<{ applied?: string[] }> {
  await requireAdminContext();
  const db = await createClient({ ignorePreview: true });
  const { data } = await db.from("site_insights").select("applied").eq("id", id).maybeSingle();
  const cur = Array.isArray(data?.applied) ? (data!.applied as string[]) : [];
  const next = on ? [...new Set([...cur, recId])] : cur.filter((x) => x !== recId);
  await db.from("site_insights").update({ applied: next }).eq("id", id);
  return { applied: next };
}
