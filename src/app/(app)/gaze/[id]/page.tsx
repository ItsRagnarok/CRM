import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSessionContext, isBackOfficeRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasModule } from "@/lib/modules";
import { todayInOrgTimeZone } from "@/lib/date";
import { CONTACT_STATUSES, dueText, unitDue } from "@/lib/gas";
import { LEVEL_STYLE } from "@/lib/compliance";
import { ImportForm, UnitForm } from "../gas-forms";
import { deleteBuilding, deleteUnit, markUnitDone, updateUnitStatus } from "../actions";

export const dynamic = "force-dynamic";

const FILTERS = [
  { id: "toate", label: "Toate" },
  { id: "depasite", label: "Depășite" },
  { id: "60", label: "În 60 de zile" },
  { id: "fara", label: "Fără dată" },
  { id: "programate", label: "Programate" },
] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fmt = (d: string | null) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString("ro-RO", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" }) : "—");

export default async function BuildingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ stare?: string; scara?: string }> }) {
  const { id } = await params;
  const { stare, scara } = await searchParams;
  const { organization, profile, readOnly } = await requireSessionContext();
  if (!hasModule(organization.enabled_modules, "scadentar_gaze") || !isBackOfficeRole(profile.role)) redirect("/dashboard");
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const today = todayInOrgTimeZone();
  const settings = { inspectionMonths: organization.gas_inspection_months, revisionMonths: organization.gas_revision_months };
  const [{ data: building }, { data: units }] = await Promise.all([
    supabase.from("gas_buildings").select("id, name, address").eq("id", id).eq("organization_id", organization.id).maybeSingle(),
    supabase.from("gas_units").select("*").eq("building_id", id).eq("organization_id", organization.id).limit(5000),
  ]);
  if (!building) notFound();

  const rows = (units ?? [])
    .map((u) => ({ ...u, due: unitDue(u, settings, today) }))
    .sort((a, b) => a.stair.localeCompare(b.stair, "ro", { numeric: true }) || a.apartment.localeCompare(b.apartment, "ro", { numeric: true }));
  const stairs = [...new Set(rows.map((r) => r.stair))];
  const filter = FILTERS.find((f) => f.id === stare)?.id ?? "toate";
  const shown = rows.filter((r) => {
    if (scara !== undefined && r.stair !== scara) return false;
    if (filter === "depasite") return (r.due.left ?? 1) < 0;
    if (filter === "60") return r.due.left !== null && r.due.left >= 0 && r.due.left <= 60;
    if (filter === "fara") return r.due.level === "unknown";
    if (filter === "programate") return r.contact_status === "programat";
    return true;
  });
  const link = (f: string, s?: string) => `/gaze/${id}?stare=${f}${s !== undefined ? `&scara=${encodeURIComponent(s)}` : ""}`;

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 p-6">
      <Link href="/gaze" className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-muted"><ArrowLeft className="h-3.5 w-3.5" /> Înapoi la scadențar</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-[22px] font-extrabold">{building.name}</h1>{building.address && <p className="mt-1 text-sm text-muted">{building.address}</p>}</div>
        {!readOnly && (
          <form action={deleteBuilding}><input type="hidden" name="id" value={id} /><button className="rounded-[10px] border border-danger/40 px-3.5 py-2 text-[13px] font-semibold text-danger">Șterge blocul și apartamentele</button></form>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => <Link key={f.id} href={link(f.id, scara)} className={`rounded-full border px-3.5 py-1.5 text-[13px] font-bold ${filter === f.id ? "border-[#1f2024] bg-[#1f2024] text-white" : "border-border bg-white text-[#344054]"}`}>{f.label}</Link>)}
        {stairs.length > 1 && <span className="mx-1 self-center text-muted">·</span>}
        {stairs.length > 1 && stairs.map((s) => <Link key={s || "_"} href={scara === s ? link(filter) : link(filter, s)} className={`rounded-full border px-3.5 py-1.5 text-[13px] font-bold ${scara === s ? "border-[#1f2024] bg-[#1f2024] text-white" : "border-border bg-white text-[#344054]"}`}>Scara {s || "—"}</Link>)}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[980px] text-left text-[13.5px]">
          <thead><tr className="border-b border-border text-[11.5px] uppercase tracking-wide text-muted"><th className="px-3 py-3">Sc.</th><th className="px-3 py-3">Ap.</th><th className="px-3 py-3">Locatar</th><th className="px-3 py-3">Ultima verificare</th><th className="px-3 py-3">Ultima revizie</th><th className="px-3 py-3">Următoarea scadență</th><th className="px-3 py-3">Contact</th><th className="px-3 py-3 text-right">Acțiuni</th></tr></thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-muted">{rows.length ? "Niciun apartament pentru filtrul ales." : "Niciun apartament încă. Lipește lista din Excel mai jos."}</td></tr>}
            {shown.map((r) => (
              <tr key={r.id} className="border-b border-[#f2f4f7] align-top last:border-0">
                <td className="px-3 py-3">{r.stair || "—"}</td>
                <td className="px-3 py-3 font-bold">{r.apartment}</td>
                <td className="px-3 py-3">{r.owner_name ?? "—"}{r.phone && <a href={`tel:${r.phone}`} className="block text-xs font-semibold text-electric">{r.phone}</a>}</td>
                <td className="px-3 py-3 tabular-nums">{fmt(r.last_inspection_on)}</td>
                <td className="px-3 py-3 tabular-nums">{fmt(r.last_revision_on)}</td>
                <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${r.due.level === "unknown" ? "bg-neutral-bg text-neutral" : LEVEL_STYLE[r.due.level]}`}>{dueText(r.due)}</span>{r.due.kind && <div className="mt-1 text-xs text-muted">{r.due.kind} · {fmt(r.due.dueOn)}</div>}</td>
                <td className="px-3 py-3">
                  {readOnly ? <span>{CONTACT_STATUSES.find((s) => s.id === r.contact_status)?.label}</span> : (
                    <form action={updateUnitStatus} className="flex flex-wrap items-center gap-1.5">
                      <input type="hidden" name="id" value={r.id} />
                      <select name="status" defaultValue={r.contact_status} className="rounded-lg border border-[#d0d5dd] px-2 py-1 text-[12.5px]">{CONTACT_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
                      <input type="date" name="scheduledOn" defaultValue={r.scheduled_on ?? ""} aria-label="Data programării" className="rounded-lg border border-[#d0d5dd] px-2 py-1 text-[12.5px]" />
                      <button className="rounded-lg border border-border px-2 py-1 text-[12.5px] font-semibold">Salvează</button>
                    </form>
                  )}
                </td>
                <td className="px-3 py-3">
                  {!readOnly && (
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <form action={markUnitDone}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="kind" value="verificare" /><button className="rounded-lg bg-electric px-2.5 py-1.5 text-[12.5px] font-bold">Verificare azi</button></form>
                      <form action={markUnitDone}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="kind" value="revizie" /><button className="rounded-lg border border-border px-2.5 py-1.5 text-[12.5px] font-semibold">Revizie azi</button></form>
                      <form action={deleteUnit}><input type="hidden" name="id" value={r.id} /><button className="rounded-lg border border-danger/40 px-2.5 py-1.5 text-[12.5px] font-semibold text-danger">Șterge</button></form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">{shown.length} din {rows.length} apartamente. „Verificare azi” și „Revizie azi” trec data de azi și marchează apartamentul „Efectuat”.</p>

      {!readOnly && <div className="grid gap-4 lg:grid-cols-2"><ImportForm buildingId={id} /><UnitForm buildingId={id} /></div>}
    </div>
  );
}
