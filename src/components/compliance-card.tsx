import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LEVEL_STYLE, complianceLevel, daysLabel, daysUntil, syncComplianceAlerts } from "@/lib/compliance";

// Dashboard card: what expires soonest. Also the moment alerts get sent, so the
// office hears about a deadline the first time it opens the platform after it is crossed.
export async function ComplianceCard({ organizationId, today }: { organizationId: string; today: string }) {
  const supabase = await createClient();
  await syncComplianceAlerts(supabase, organizationId, today);
  const horizon = new Date(Date.parse(`${today}T00:00:00Z`) + 61 * 86_400_000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("compliance_items")
    .select("id, title, subject, expires_on")
    .eq("organization_id", organizationId)
    .lte("expires_on", horizon)
    .order("expires_on", { ascending: true })
    .limit(5);
  const items = (data ?? []).map((i) => ({ ...i, left: daysUntil(i.expires_on, today) }));

  return (
    <div className="rounded-[13px] border border-border bg-white">
      <div className="flex items-center justify-between border-b border-[#f2f4f7] px-4 py-3">
        <h2 className="flex items-center gap-2 text-[13.5px] font-bold text-foreground">
          <ShieldCheck className="h-4 w-4 text-muted" /> Scadențe în 60 de zile
        </h2>
        <Link href="/conformitate" className="text-[12.5px] font-semibold text-electric">Registru →</Link>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-4 text-[13px] text-muted">Nimic nu expiră în următoarele 60 de zile.</p>
      ) : (
        <ul className="divide-y divide-[#f2f4f7]">
          {items.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
              <span className="min-w-0"><span className="block truncate font-semibold">{i.title}</span><span className="block truncate text-xs text-muted">{i.subject}</span></span>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${LEVEL_STYLE[complianceLevel(i.left)]}`}>{daysLabel(i.left)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
