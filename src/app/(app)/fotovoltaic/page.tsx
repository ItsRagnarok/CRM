import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSessionContext, isBackOfficeRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasModule } from "@/lib/modules";
import { todayInOrgTimeZone } from "@/lib/date";
import { BOARD_STAGES, openClocks } from "@/lib/pv";
import { ProjectForm, PvSettingsForm } from "./pv-forms";

export const dynamic = "force-dynamic";

export default async function FotovoltaicPage() {
  const { organization, profile, readOnly } = await requireSessionContext();
  if (!hasModule(organization.enabled_modules, "dosar_fotovoltaic") || !isBackOfficeRole(profile.role)) redirect("/dashboard");
  const supabase = await createClient();
  const today = todayInOrgTimeZone();
  const terms = { atrDays: organization.pv_atr_days, certDays: organization.pv_cert_days };
  const { data } = await supabase.from("pv_projects").select("*").eq("organization_id", organization.id).neq("stage", "anulat").order("created_at", { ascending: false }).limit(1000);
  const projects = (data ?? []).map((p) => ({ ...p, clocks: openClocks(p, terms, today) }));
  const overdue = projects.filter((p) => p.stage !== "finalizat" && p.clocks.some((c) => c.overdue)).length;
  const kwp = projects.filter((p) => p.stage !== "finalizat").reduce((a, p) => a + Number(p.kwp ?? 0), 0);
  const afm = projects.filter((p) => p.afm_filed_on && !p.afm_paid_on).length;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 p-6">
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground">Fotovoltaic · dosare</h1>
        <p className="mt-1 text-sm text-muted">De la ofertă la garanție. Termenele operatorului se numără singure, iar la depășire primești un mesaj pregătit pentru operator.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[["Dosare active", projects.filter((p) => p.stage !== "finalizat").length, ""], ["Termen operator depășit", overdue, overdue ? "border-danger/40 bg-danger-bg" : ""], ["În lucru (kWp)", kwp.toLocaleString("ro-RO", { maximumFractionDigits: 1 }), ""], ["Decontări AFM așteptate", afm, afm ? "border-warning/40 bg-warning-bg" : ""]].map(([l, n, cls]) => (
          <div key={l as string} className={`rounded-2xl border border-border bg-white p-4 ${cls}`}><div className="text-xs font-semibold text-muted">{l}</div><div className="mt-1 text-[28px] font-extrabold tabular-nums">{n}</div></div>
        ))}
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1100px] grid-cols-6 gap-3">
          {BOARD_STAGES.map((s) => {
            const items = projects.filter((p) => p.stage === s.id);
            return (
              <div key={s.id} className="rounded-2xl bg-[#eceee9] p-2.5">
                <h3 className="flex justify-between px-1.5 pb-2 pt-1 text-[12.5px] font-extrabold text-[#344054]"><span>{s.label}</span><span className="text-muted">{items.length}</span></h3>
                <div className="flex flex-col gap-2">
                  {items.map((p) => {
                    const worst = p.clocks.find((c) => c.overdue) ?? p.clocks[0];
                    return (
                      <Link key={p.id} href={`/fotovoltaic/${p.id}`} className={`block rounded-xl border bg-white p-3 text-[12.5px] ${worst?.overdue ? "border-danger/50" : "border-border"}`}>
                        <b className="block text-[13px]">{p.name}</b>
                        <span className="text-muted">{p.kwp ? `${Number(p.kwp).toLocaleString("ro-RO")} kWp` : "—"}{p.contact_name ? ` · ${p.contact_name}` : ""}</span>
                        {worst && (
                          <span className={`mt-2 block rounded-md px-2 py-1 text-[11.5px] font-bold ${worst.overdue ? "bg-danger-bg text-danger" : "bg-warning-bg text-warning"}`}>
                            {worst.label}: {worst.elapsed} zile{worst.termDays ? ` din ${worst.termDays}` : ""}{worst.overdue ? " · depășit" : ""}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                  {items.length === 0 && <p className="px-1.5 py-3 text-xs text-muted">Niciun dosar.</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!readOnly && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ProjectForm />
          {profile.role === "admin" && <PvSettingsForm atrDays={terms.atrDays} certDays={terms.certDays} />}
        </div>
      )}
    </div>
  );
}
