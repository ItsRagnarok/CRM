import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { notifyBackOffice } from "@/lib/notify";
import { daysUntil, thresholdFor } from "@/lib/compliance";

/**
 * Sends one notification (bell + push) per item each time it crosses a threshold,
 * remembering the last one in last_alert_days. Called when the office opens the
 * dashboard or the registry, so no scheduled job is needed.
 */
export async function syncComplianceAlerts(supabase: SupabaseClient<Database>, organizationId: string, today: string) {
  const horizon = new Date(Date.parse(`${today}T00:00:00Z`) + 61 * 86_400_000).toISOString().slice(0, 10);
  const { data: items } = await supabase
    .from("compliance_items")
    .select("id, title, subject, expires_on, last_alert_days")
    .eq("organization_id", organizationId)
    .lte("expires_on", horizon);
  for (const item of items ?? []) {
    const left = daysUntil(item.expires_on, today);
    const threshold = thresholdFor(left);
    if (threshold === null) continue;
    if (item.last_alert_days !== null && item.last_alert_days <= threshold) continue;
    // Claim it first so two open tabs do not both notify.
    const { data: claimed } = await supabase
      .from("compliance_items")
      .update({ last_alert_days: threshold })
      .eq("id", item.id)
      .or(`last_alert_days.is.null,last_alert_days.gt.${threshold}`)
      .select("id");
    if (!claimed?.length) continue;
    await notifyBackOffice(supabase, {
      organizationId,
      type: "compliance_alert",
      title: left < 0 ? `Expirat: ${item.title}` : `Expiră în ${left} zile: ${item.title}`,
      body: `${item.subject} · ${new Date(`${item.expires_on}T12:00:00Z`).toLocaleDateString("ro-RO", { timeZone: "UTC" })}`,
      link: "/conformitate",
    });
  }
}
