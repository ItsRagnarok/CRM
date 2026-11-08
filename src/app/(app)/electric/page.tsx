import Link from "next/link";
import { redirect } from "next/navigation";
import { Zap } from "lucide-react";
import { requireSessionContext, isBackOfficeRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasModule } from "@/lib/modules";
import { todayInOrgTimeZone } from "@/lib/date";
import { daysUntil } from "@/lib/compliance";
import { EmptyState } from "@/components/empty-state";
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES } from "@/lib/status";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function ElectricPage() {
  const { organization, profile } = await requireSessionContext();
  if (!hasModule(organization.enabled_modules, "buletine_electrice") || !isBackOfficeRole(profile.role)) redirect("/dashboard");
  const supabase = await createClient();
  const today = todayInOrgTimeZone();
  const horizon = new Date(Date.parse(`${today}T00:00:00Z`) + 60 * 86_400_000).toISOString().slice(0, 10);
  const org = organization.id;

  const [{ data: jobs }, { data: meas }, { data: reports }, { data: hidden }, { data: devices }] = await Promise.all([
    supabase.from("jobs").select("id, display_number, title, status, scheduled_date, clients(name)").eq("organization_id", org).eq("domain", "electric").neq("status", "anulata").order("scheduled_date", { ascending: false }).limit(300),
    supabase.from("electric_measurements").select("job_id, result").eq("organization_id", org),
    supabase.from("electric_reports").select("job_id, signed_on").eq("organization_id", org),
    supabase.from("electric_hidden_works").select("job_id, documented").eq("organization_id", org),
    hasModule(organization.enabled_modules, "conformitate")
      ? supabase.from("compliance_items").select("id, expires_on").eq("organization_id", org).eq("kind", "device").lte("expires_on", horizon)
      : Promise.resolve({ data: [] as { id: string; expires_on: string }[] }),
  ]);

  const per = new Map<string, { m: number; open: number; unsigned: number; hiddenOpen: number }>();
  const get = (id: string) => per.get(id) ?? { m: 0, open: 0, unsigned: 0, hiddenOpen: 0 };
  for (const x of meas ?? []) { const p = get(x.job_id); p.m++; if (!x.result) p.open++; per.set(x.job_id, p); }
  for (const x of reports ?? []) { const p = get(x.job_id); if (!x.signed_on) p.unsigned++; per.set(x.job_id, p); }
  for (const x of hidden ?? []) { const p = get(x.job_id); if (!x.documented) p.hiddenOpen++; per.set(x.job_id, p); }
  const active = (jobs ?? []).filter((j) => j.status !== "finalizata").length;
  const unsigned = [...per.values()].reduce((a, p) => a + p.unsigned, 0);
  const hiddenOpen = [...per.values()].reduce((a, p) => a + p.hiddenOpen, 0);
  const deviceSoon = (devices ?? []).filter((d) => daysUntil(d.expires_on, today) <= 60).length;

  const k = (l: string, n: number, s: string, warn = false) => (
    <div className={`rounded-2xl border bg-white p-4 ${warn && n ? "border-[#f5c27a] bg-[#fffaf0]" : "border-border"}`}><div className="text-xs font-semibold text-muted">{l}</div><div className="mt-1 text-[28px] font-extrabold tabular-nums">{n}</div><div className="mt-1 text-[12px] text-muted">{s}</div></div>
  );
  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5 p-6">
      <div><h1 className="text-[22px] font-extrabold">Electric · lucrări, măsurători și buletine</h1><p className="mt-1 text-sm text-muted">Lucrările cu domeniul „Electrice”. Alegi domeniul când creezi lucrarea.</p></div>
      <div className="grid gap-3 sm:grid-cols-4">
        {k("Lucrări electrice active", active, "nefinalizate")}
        {k("Buletine nesemnate", unsigned, "așteaptă un semnatar autorizat", true)}
        {k("Lucrări ascunse nedocumentate", hiddenOpen, "de documentat cu poze înainte de acoperire", true)}
        {k("Aparate cu calibrare în 60 de zile", deviceSoon, "din registrul de conformitate", true)}
      </div>
      {(jobs ?? []).length === 0 ? (
        <EmptyState icon={Zap} title="Nicio lucrare electrică" description="Creează o lucrare și alege domeniul „Electrice”, apoi adaugă aici măsurătorile și buletinele." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full min-w-[820px] text-left text-[13.5px]">
            <thead><tr className="border-b border-border text-[11.5px] uppercase tracking-wide text-muted"><th className="px-4 py-3">Lucrare</th><th className="px-3 py-3">Client</th><th className="px-3 py-3 text-right">Măsurători</th><th className="px-3 py-3 text-right">Fără rezultat</th><th className="px-3 py-3 text-right">Buletine nesemnate</th><th className="px-3 py-3 text-right">Ascunse de documentat</th><th className="px-4 py-3">Stare</th></tr></thead>
            <tbody>
              {(jobs ?? []).map((j) => { const p = get(j.id); return (
                <tr key={j.id} className="border-b border-[#f2f4f7] last:border-0">
                  <td className="px-4 py-3"><Link href={`/electric/${j.id}`} className="font-bold hover:underline">#{j.display_number} · {j.title}</Link></td>
                  <td className="px-3 py-3">{j.clients?.name ?? "—"}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{p.m}</td>
                  <td className={`px-3 py-3 text-right tabular-nums ${p.open ? "font-bold text-warning" : ""}`}>{p.open}</td>
                  <td className={`px-3 py-3 text-right tabular-nums ${p.unsigned ? "font-bold text-warning" : ""}`}>{p.unsigned}</td>
                  <td className={`px-3 py-3 text-right tabular-nums ${p.hiddenOpen ? "font-bold text-warning" : ""}`}>{p.hiddenOpen}</td>
                  <td className="px-4 py-3"><StatusBadge label={JOB_STATUS_LABELS[j.status]} className={JOB_STATUS_STYLES[j.status]} /></td>
                </tr>
              ); })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
