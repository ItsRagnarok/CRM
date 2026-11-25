import { notFound } from "next/navigation";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todayInOrgTimeZone } from "@/lib/date";
import { unitDue } from "@/lib/gas";
import { ScreenHeader } from "@/components/mobile/ui";
import { BuildingList, type UnitRow } from "./building-list";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Lista de pe bloc: fiecare apartament cu starea lui pe această lucrare și documentele care expiră. */
export default async function BuildingJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { organization } = await requireSessionContext();
  const supabase = await createClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("id, display_number, gas_building_id, gas_buildings(name, address)")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!job?.gas_building_id) notFound();

  const [{ data: units }, { data: records }, { data: visits }] = await Promise.all([
    supabase
      .from("gas_units")
      .select("id, stair, apartment, owner_name, phone, last_inspection_on, last_revision_on, contact_status, scheduled_on, hose_valid_until, detector_valid_until, chimney_doc_on")
      .eq("building_id", job.gas_building_id)
      .limit(2000),
    supabase.from("gas_records").select("unit_id, kind, completed_at, gas_interrupted").eq("job_id", id),
    supabase.from("gas_visits").select("unit_id, outcome, reschedule_on, occurred_at").eq("job_id", id).order("occurred_at", { ascending: false }),
  ]);

  const today = todayInOrgTimeZone();
  const settings = { inspectionMonths: organization.gas_inspection_months, revisionMonths: organization.gas_revision_months };
  const recByUnit = new Map((records ?? []).filter((r) => r.unit_id).map((r) => [r.unit_id!, r]));
  const visitByUnit = new Map<string, { outcome: string; reschedule_on: string | null }>();
  for (const v of visits ?? []) if (!visitByUnit.has(v.unit_id)) visitByUnit.set(v.unit_id, v);

  const rows: UnitRow[] = (units ?? [])
    .map((u) => {
      const rec = recByUnit.get(u.id);
      const visit = visitByUnit.get(u.id);
      const due = unitDue(u, settings, today);
      const state: UnitRow["state"] = rec?.completed_at
        ? rec.gas_interrupted ? "sistat" : "facut"
        : rec ? "inceput"
        : visit ? (visit.outcome as UnitRow["state"])
        : "de_facut";
      const expired = [
        u.hose_valid_until && u.hose_valid_until < today ? "racord expirat" : null,
        u.detector_valid_until && u.detector_valid_until < today ? "detector expirat" : null,
      ].filter(Boolean) as string[];
      return {
        id: u.id,
        stair: u.stair,
        apartment: u.apartment,
        owner: u.owner_name,
        phone: u.phone,
        state,
        kind: rec?.kind === "revizie" || rec?.kind === "verificare" ? rec.kind : due.kind ?? "verificare",
        rescheduleOn: visit?.reschedule_on ?? null,
        expired,
      };
    })
    .sort((a, b) => a.stair.localeCompare(b.stair, "ro", { numeric: true }) || a.apartment.localeCompare(b.apartment, "ro", { numeric: true }));

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={job.gas_buildings?.name ?? "Bloc"} subtitle={`Lucrarea #${job.display_number}${job.gas_buildings?.address ? ` · ${job.gas_buildings.address}` : ""}`} back={`/mobil/lucrari/${id}`} />
      <BuildingList jobId={id} rows={rows} today={today} />
    </div>
  );
}
