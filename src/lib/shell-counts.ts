import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { hasModule } from "@/lib/modules";

export type NavBadges = Partial<Record<"/conformitate" | "/facturare" | "/pontaj" | "/materiale" | "/mesaje", number>>;

/** Numbers shown next to the sidebar items: what is waiting for the office. */
export async function loadNavBadges(supabase: SupabaseClient<Database>, organizationId: string, modules: string[], today: string): Promise<NavBadges> {
  const horizon = new Date(Date.parse(`${today}T00:00:00Z`) + 30 * 86_400_000).toISOString().slice(0, 10);
  const head = { count: "exact" as const, head: true };
  const [compliance, billing, expenses, timeOff, purchases] = await Promise.all([
    hasModule(modules, "conformitate")
      ? supabase.from("compliance_items").select("id", head).eq("organization_id", organizationId).lte("expires_on", horizon)
      : Promise.resolve({ count: 0 }),
    supabase.from("billing_requests").select("id", head).eq("organization_id", organizationId).eq("status", "new"),
    supabase.from("expenses").select("id", head).eq("organization_id", organizationId).eq("status", "pending"),
    supabase.from("time_off_requests").select("id", head).eq("organization_id", organizationId).eq("status", "pending"),
    supabase.from("purchase_requests").select("id", head).eq("organization_id", organizationId).eq("status", "pending"),
  ]);
  return {
    "/conformitate": compliance.count ?? 0,
    "/facturare": billing.count ?? 0,
    "/pontaj": (expenses.count ?? 0) + (timeOff.count ?? 0),
    "/materiale": purchases.count ?? 0,
  };
}
