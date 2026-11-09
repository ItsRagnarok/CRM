import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsLive, type SiteAnalytics } from "./analytics-live";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireAdminContext();
  const db = await createClient({ ignorePreview: true });
  const { data } = await db.rpc("ef_site_analytics", { p_period: "24h" });
  return <AnalyticsLive initial={(data as unknown as SiteAnalytics) ?? null} />;
}
