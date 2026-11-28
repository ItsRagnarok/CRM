import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProspectBoard } from "./prospect-board";

export default async function ProspectingPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  await requireAdminContext();
  const { c } = await searchParams;
  const db = await createClient({ ignorePreview: true });
  const campaigns = await db.from("prospect_campaigns").select("*").order("created_at", { ascending: true });
  if (campaigns.error) return <p role="alert" className="p-6 text-danger">Nu am putut încărca prospectarea. Verifică dacă migrarea „prospecting” a fost aplicată.</p>;
  const list = campaigns.data ?? [];
  const current = list.find((x) => x.id === c) ?? list[0] ?? null;

  const [counts, companies, runs] = await Promise.all([
    db.from("prospect_companies").select("campaign_id, status").limit(20000),
    current ? db.from("prospect_companies").select("*, prospect_people(id, name, role, email, email_status, linkedin, source_url)")
      .eq("campaign_id", current.id).order("fit_score", { ascending: false, nullsFirst: false }).order("found_at", { ascending: false }).limit(1500) : Promise.resolve({ data: [], error: null }),
    current ? db.from("prospect_runs").select("*").eq("campaign_id", current.id).order("started_at", { ascending: false }).limit(30) : Promise.resolve({ data: [], error: null }),
  ]);
  const byCampaign: Record<string, { total: number; pending: number }> = {};
  for (const r of counts.data ?? []) {
    const x = (byCampaign[r.campaign_id] ??= { total: 0, pending: 0 });
    x.total++;
    if (r.status === "candidat") x.pending++;
  }
  return <ProspectBoard key={current?.id ?? "none"} campaigns={list} counts={byCampaign} current={current} companies={companies.data ?? []} runs={runs.data ?? []} />;
}
