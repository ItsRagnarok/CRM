import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { requireSessionContext, isBackOfficeRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasModule } from "@/lib/modules";
import { todayInOrgTimeZone } from "@/lib/date";
import { domainLabel } from "@/lib/domains";
import { KIND_LABELS, LEVEL_STYLE, complianceLevel, daysLabel, daysUntil, syncComplianceAlerts, type ComplianceKind } from "@/lib/compliance";
import { EmptyState } from "@/components/empty-state";
import { ComplianceForm } from "./compliance-form";
import { deleteComplianceItem, renewComplianceItem } from "./actions";

export const dynamic = "force-dynamic";

export default async function ConformitatePage({ searchParams }: { searchParams: Promise<{ tip?: string }> }) {
  const { tip } = await searchParams;
  const { organization, profile, readOnly } = await requireSessionContext();
  if (!hasModule(organization.enabled_modules, "conformitate") || !isBackOfficeRole(profile.role)) redirect("/dashboard");

  const kind = (["person", "device", "vehicle", "company"] as const).find((k) => k === tip) ?? null;
  const supabase = await createClient();
  const today = todayInOrgTimeZone();

  const [{ data: items }, { data: people }] = await Promise.all([
    supabase.from("compliance_items").select("id, kind, title, subject, domain, issued_on, expires_on, notes").eq("organization_id", organization.id).order("expires_on", { ascending: true }),
    supabase.from("profiles").select("id, full_name").eq("organization_id", organization.id).eq("is_active", true).order("full_name"),
  ]);
  if (!readOnly) await syncComplianceAlerts(supabase, organization.id, today);

  const all = (items ?? []).map((i) => ({ ...i, left: daysUntil(i.expires_on, today) }));
  const counts = { expired: all.filter((i) => i.left < 0).length, soon: all.filter((i) => i.left >= 0 && i.left <= 30).length };
  const shown = kind ? all.filter((i) => i.kind === kind) : all;

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold text-foreground">Conformitate</h1>
          <p className="mt-1 text-sm text-muted">Legitimații, autorizații, aparate și mașini cu data de expirare. Primești alertă cu 60, 30 și 7 zile înainte, și când expiră.</p>
        </div>
        {!readOnly && <ComplianceForm people={(people ?? []).map((p) => ({ id: p.id, name: p.full_name }))} defaultKind={kind ?? "person"} />}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-4"><div className="text-xs font-semibold text-muted">Documente urmărite</div><div className="mt-1 text-[28px] font-extrabold">{all.length}</div></div>
        <div className={`rounded-2xl border p-4 ${counts.expired ? "border-danger/40 bg-danger-bg" : "border-border bg-white"}`}><div className="text-xs font-semibold text-muted">Expirate</div><div className="mt-1 text-[28px] font-extrabold">{counts.expired}</div></div>
        <div className={`rounded-2xl border p-4 ${counts.soon ? "border-warning/40 bg-warning-bg" : "border-border bg-white"}`}><div className="text-xs font-semibold text-muted">Expiră în 30 de zile</div><div className="mt-1 text-[28px] font-extrabold">{counts.soon}</div></div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[{ k: null, l: `Toate · ${all.length}` }, ...(Object.keys(KIND_LABELS) as ComplianceKind[]).map((k) => ({ k, l: `${KIND_LABELS[k]} · ${all.filter((i) => i.kind === k).length}` }))].map(({ k, l }) => (
          <Link key={l} href={k ? `/conformitate?tip=${k}` : "/conformitate"} className={`rounded-full border px-3.5 py-1.5 text-[13px] font-bold ${kind === k ? "border-[#1f2024] bg-[#1f2024] text-white" : "border-border bg-white text-[#344054]"}`}>{l}</Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Nimic urmărit încă" description="Adaugă prima legitimație, autorizație, aparat sau mașină. Platforma te anunță înainte să expire." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full min-w-[760px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-border text-[11.5px] uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Document</th><th className="px-4 py-3">Pentru</th><th className="px-4 py-3">Expiră</th><th className="px-4 py-3">Stare</th><th className="px-4 py-3 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((i) => (
                <tr key={i.id} className="border-b border-[#f2f4f7] last:border-0 align-top">
                  <td className="px-4 py-3"><div className="font-bold">{i.title}</div><div className="text-xs text-muted">{KIND_LABELS[i.kind]}{i.domain ? ` · ${domainLabel(i.domain)}` : ""}{i.notes ? ` · ${i.notes}` : ""}</div></td>
                  <td className="px-4 py-3">{i.subject}</td>
                  <td className="px-4 py-3 tabular-nums">{new Date(`${i.expires_on}T12:00:00Z`).toLocaleDateString("ro-RO", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" })}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${LEVEL_STYLE[complianceLevel(i.left)]}`}>{daysLabel(i.left)}</span></td>
                  <td className="px-4 py-3">
                    {!readOnly && (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <form action={renewComplianceItem} className="flex items-center gap-1.5">
                          <input type="hidden" name="id" value={i.id} />
                          <input type="date" name="expiresOn" required aria-label="Noua dată de expirare" className="rounded-lg border border-[#d0d5dd] px-2 py-1 text-[12.5px]" />
                          <button className="rounded-lg bg-electric px-2.5 py-1.5 text-[12.5px] font-bold">Reînnoiește</button>
                        </form>
                        <form action={deleteComplianceItem}><input type="hidden" name="id" value={i.id} /><button className="rounded-lg border border-danger/40 px-2.5 py-1.5 text-[12.5px] font-semibold text-danger">Șterge</button></form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
