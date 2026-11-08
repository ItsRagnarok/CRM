import Link from "next/link";
import { redirect } from "next/navigation";
import { Car } from "lucide-react";
import { requireSessionContext, isBackOfficeRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todayInOrgTimeZone } from "@/lib/date";
import { StocTabs } from "@/components/stoc-tabs";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

const MONTHS = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];
const km1 = (n: number) => n.toLocaleString("ro-RO", { maximumFractionDigits: 0 });
const lei = (n: number) => `${Math.round(n).toLocaleString("ro-RO")} lei`;

/**
 * Foaie de parcurs generată din ce există deja: lucrările terminate ale echipei căreia îi e alocată mașina.
 * Nu cere nicio introducere în plus. Kilometrii sunt cei înregistrați pe lucrare (distance_km).
 * Pentru deducerea fiscală a mașinilor, forma finală se confirmă cu contabilul.
 */
export default async function FoaieParcursPage({ searchParams }: { searchParams: Promise<{ luna?: string; masina?: string }> }) {
  const { organization, profile } = await requireSessionContext();
  if (!isBackOfficeRole(profile.role)) redirect("/dashboard");
  const sp = await searchParams;
  const today = todayInOrgTimeZone();
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.luna ?? "") ? (sp.luna as string) : today.slice(0, 7);
  const [y, mo] = month.split("-").map(Number);
  const first = `${month}-01`;
  const next = mo === 12 ? `${y + 1}-01-01` : `${y}-${String(mo + 1).padStart(2, "0")}-01`;
  const prev = mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, "0")}`;
  const nextMonth = next.slice(0, 7);

  const supabase = await createClient();
  const { data: vehicles } = await supabase.from("vehicles").select("id, name, plate_number, assigned_team_id, driver_id, teams:assigned_team_id(name), driver:driver_id(full_name)")
    .eq("organization_id", organization.id).eq("is_active", true).order("plate_number");
  const list = (vehicles ?? []).filter((v) => v.assigned_team_id);
  const chosen = list.find((v) => v.id === sp.masina) ?? null;
  const shown = chosen ? [chosen] : list;
  const teamIds = shown.map((v) => v.assigned_team_id as string);

  const { data: jobs } = teamIds.length
    ? await supabase.from("jobs").select("id, team_id, scheduled_date, start_time, title, distance_km, locations(address), clients(name)")
        .eq("organization_id", organization.id).eq("status", "finalizata").in("team_id", teamIds).gte("scheduled_date", first).lt("scheduled_date", next).order("scheduled_date").order("start_time")
    : { data: [] };

  const fuel = Number(organization.fuel_cost_per_km ?? 0);
  const dateFmt = new Intl.DateTimeFormat("ro-RO", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });

  return (
    <div className="flex flex-col gap-5 p-7">
      <StocTabs active="/foaie-parcurs" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight">Foaie de parcurs · {MONTHS[mo - 1]} {y}</h1>
          <p className="mt-1 text-[13.5px] text-muted">Generată automat din lucrările terminate ale echipei fiecărei mașini. Nu trebuie completat nimic de mână.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold">
          <Link href={`?luna=${prev}${chosen ? `&masina=${chosen.id}` : ""}`} className="rounded-full border border-border bg-white px-3 py-1.5">← {prev}</Link>
          <Link href={`?luna=${nextMonth}${chosen ? `&masina=${chosen.id}` : ""}`} className="rounded-full border border-border bg-white px-3 py-1.5">{nextMonth} →</Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Alege mașina">
        <Link href={`?luna=${month}`} className={`rounded-full border px-3.5 py-1.5 text-[13px] font-bold ${!chosen ? "border-[#1f2024] bg-[#1f2024] text-white" : "border-border bg-white"}`}>Toate mașinile</Link>
        {list.map((v) => (
          <Link key={v.id} href={`?luna=${month}&masina=${v.id}`} className={`rounded-full border px-3.5 py-1.5 text-[13px] font-bold ${chosen?.id === v.id ? "border-[#1f2024] bg-[#1f2024] text-white" : "border-border bg-white"}`}>{v.plate_number ?? v.name}</Link>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Car} title="Nicio mașină alocată unei echipe" description="Alocă mașinile echipelor din pagina Echipe, iar foaia de parcurs se generează singură din lucrările lor." />
      ) : (
        shown.map((v) => {
          const vj = (jobs ?? []).filter((j) => j.team_id === v.assigned_team_id);
          const km = vj.reduce((a, j) => a + Number(j.distance_km ?? 0), 0);
          const days = new Set(vj.map((j) => j.scheduled_date)).size;
          return (
            <section key={v.id} className="rounded-2xl border border-border bg-white p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[15px] font-bold">{v.plate_number ?? "fără număr"} <span className="font-medium text-muted">· {v.name} · {(v.teams as { name: string } | null)?.name ?? "—"} · conducător: {(v.driver as { full_name: string } | null)?.full_name ?? "—"}</span></h2>
                <div className="text-[13px] font-semibold tabular-nums">{days} zile · {km1(km)} km{fuel > 0 ? ` · ~${lei(km * fuel)} combustibil` : ""}</div>
              </div>
              {vj.length === 0 ? (
                <p className="py-3 text-[13px] text-muted">Nicio lucrare terminată în luna aceasta.</p>
              ) : (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-left text-[12.5px]">
                    <thead><tr className="text-muted"><th className="py-2 pr-3 font-semibold">Data</th><th className="pr-3 font-semibold">Plecare → destinație</th><th className="pr-3 font-semibold">Scop</th><th className="text-right font-semibold">Km</th></tr></thead>
                    <tbody>
                      {vj.map((j) => (
                        <tr key={j.id} className="border-t border-[#eef0f4]">
                          <td className="py-2 pr-3 whitespace-nowrap tabular-nums">{dateFmt.format(new Date(`${j.scheduled_date}T00:00:00Z`))}</td>
                          <td className="pr-3">Sediu → {(j.locations as { address: string } | null)?.address ?? (j.clients as { name: string } | null)?.name ?? "—"}</td>
                          <td className="pr-3"><Link href={`/lucrari/${j.id}`} className="font-semibold underline-offset-2 hover:underline">{j.title}</Link></td>
                          <td className="text-right tabular-nums">{j.distance_km != null ? km1(Number(j.distance_km)) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })
      )}
      <p className="text-[11.5px] text-muted">Kilometrii sunt cei înregistrați pe fiecare lucrare. Pentru deducerea fiscală a mașinilor, forma finală a foii de parcurs se confirmă cu contabilul.</p>
    </div>
  );
}
