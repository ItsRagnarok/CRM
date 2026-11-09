import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsLive, type SiteAnalytics } from "./analytics-live";
import { Exclusions, type Exclusion } from "./exclusions";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireAdminContext();
  const db = await createClient({ ignorePreview: true });
  const [{ data }, { data: exclusions }] = await Promise.all([db.rpc("ef_site_stats", { p_period: "24h" }), db.rpc("ef_site_exclusions_list")]);
  return <><AnalyticsLive initial={(data as unknown as SiteAnalytics) ?? null} /><div className="mx-auto max-w-6xl px-6 pb-8"><Exclusions items={(exclusions as unknown as Exclusion[]) ?? []} /></div></>;
}
