import Link from "next/link";
import { redirect } from "next/navigation";
import { Flame } from "lucide-react";
import { requireSessionContext, isBackOfficeRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasModule } from "@/lib/modules";
import { todayInOrgTimeZone } from "@/lib/date";
import { unitDue } from "@/lib/gas";
import { EmptyState } from "@/components/empty-state";
import { BuildingForm, SettingsForm } from "./gas-forms";

export const dynamic = "force-dynamic";

export default async function GazePage() {
  const { organization, profile, readOnly } = await requireSessionContext();
  if (!hasModule(organization.enabled_modules, "scadentar_gaze") || !isBackOfficeRole(profile.role)) redirect("/dashboard");
  const supabase = await createClient();
  const today = todayInOrgTimeZone();
  const settings = { inspectionMonths: organization.gas_inspection_months, revisionMonths: organization.gas_revision_months };

  const [{ data: buildings }, { data: units }] = await Promise.all([
    supabase.from("gas_buildings").select("id, name, address").eq("organization_id", organization.id).order("name"),
    supabase.from("gas_units").select("building_id, last_inspection_on, last_revision_on, contact_status").eq("organization_id", organization.id).limit(20000),
  ]);

  const stats = new Map<string, { total: number; overdue: number; soon: number; unknown: number; scheduled: number }>();
  for (const u of units ?? []) {
    const s = stats.get(u.building_id) ?? { total: 0, overdue: 0, soon: 0, unknown: 0, scheduled: 0 };
    const due = unitDue(u, settings, today);
    s.total++;
    if (due.level === "unknown") s.unknown++;
    else if ((due.left ?? 1) < 0) s.overdue++;
    else if ((due.left ?? 999) <= 60) s.soon++;
    if (u.contact_status === "programat") s.scheduled++;
    stats.set(u.building_id, s);
  }
  const all = [...stats.values()];
  const sum = (k: "total" | "overdue" | "soon" | "unknown") => all.reduce((a, s) => a + s[k], 0);

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5 p-6">
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground">Gaze · scadențar</h1>
        <p className="mt-1 text-sm text-muted">Pe bloc, scară și apartament: cine are verificarea sau revizia scadentă, cine e programat, cine nu răspunde.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[["Apartamente", sum("total"), ""], ["Scadențe depășite", sum("overdue"), sum("overdue") ? "border-danger/40 bg-danger-bg" : ""], ["Scadente în 60 de zile", sum("soon"), sum("soon") ? "border-warning/40 bg-warning-bg" : ""], ["Fără nicio dată", sum("unknown"), ""]].map(([l, n, cls]) => (
          <div key={l as string} className={`rounded-2xl border border-border bg-white p-4 ${cls}`}><div className="text-xs font-semibold text-muted">{l}</div><div className="mt-1 text-[28px] font-extrabold tabular-nums">{n}</div></div>
        ))}
      </div>

      {(buildings ?? []).length === 0 ? (
        <EmptyState icon={Flame} title="Niciun bloc încă" description="Creează primul bloc, apoi lipește lista de apartamente din Excel. Scadențele se calculează singure." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full min-w-[720px] text-left text-[13.5px]">
            <thead><tr className="border-b border-border text-[11.5px] uppercase tracking-wide text-muted"><th className="px-4 py-3">Bloc</th><th className="px-4 py-3 text-right">Apartamente</th><th className="px-4 py-3 text-right">Depășite</th><th className="px-4 py-3 text-right">În 60 zile</th><th className="px-4 py-3 text-right">Programate</th><th className="px-4 py-3 text-right">Fără dată</th><th className="px-4 py-3" /></tr></thead>
            <tbody>
              {(buildings ?? []).map((b) => {
                const s = stats.get(b.id) ?? { total: 0, overdue: 0, soon: 0, unknown: 0, scheduled: 0 };
                return (
                  <tr key={b.id} className="border-b border-[#f2f4f7] last:border-0">
                    <td className="px-4 py-3"><div className="font-bold">{b.name}</div>{b.address && <div className="text-xs text-muted">{b.address}</div>}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.total}</td>
                    <td className={`px-4 py-3 text-right tabular-nums font-bold ${s.overdue ? "text-danger" : ""}`}>{s.overdue}</td>
                    <td className={`px-4 py-3 text-right tabular-nums font-bold ${s.soon ? "text-warning" : ""}`}>{s.soon}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.scheduled}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.unknown}</td>
                    <td className="px-4 py-3 text-right"><Link href={`/gaze/${b.id}`} className="font-semibold text-electric">Deschide →</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!readOnly && (
        <div className="grid gap-4 lg:grid-cols-2">
          <BuildingForm />
          {profile.role === "admin" && <SettingsForm inspectionMonths={settings.inspectionMonths} revisionMonths={settings.revisionMonths} />}
        </div>
      )}
    </div>
  );
}
