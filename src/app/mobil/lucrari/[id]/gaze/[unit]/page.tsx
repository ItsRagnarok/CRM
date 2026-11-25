import { notFound } from "next/navigation";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todayInOrgTimeZone } from "@/lib/date";
import { unitDue } from "@/lib/gas";
import { INSTALLER_KEYS } from "@/lib/forms/gas-record";
import { GasForm } from "./gas-form";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Fișa de evidență pentru un apartament din bloc (unit = id) sau pentru locul lucrării (unit = „loc”). */
export default async function GasRecordPage({ params, searchParams }: { params: Promise<{ id: string; unit: string }>; searchParams: Promise<{ tip?: string }> }) {
  const { id, unit } = await params;
  const { tip } = await searchParams;
  if (!UUID.test(id) || (unit !== "loc" && !UUID.test(unit))) notFound();
  const unitId = unit === "loc" ? null : unit;
  const { organization, profile } = await requireSessionContext();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, display_number, title, gas_building_id, clients(name), locations(address), gas_buildings(name, address)")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!job) notFound();

  let recQ = supabase.from("gas_records").select("kind, data, completed_at").eq("job_id", id);
  recQ = unitId ? recQ.eq("unit_id", unitId) : recQ.is("unit_id", null);
  const [{ data: unitRow }, { data: saved }, { data: lastMine }] = await Promise.all([
    unitId
      ? supabase.from("gas_units").select("id, building_id, stair, apartment, owner_name, last_inspection_on, last_revision_on").eq("id", unitId).eq("organization_id", organization.id).maybeSingle()
      : Promise.resolve({ data: null }),
    recQ.maybeSingle(),
    supabase.from("gas_records").select("data").eq("completed_by", profile.id).not("completed_at", "is", null).order("completed_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (unitId && (!unitRow || unitRow.building_id !== job.gas_building_id)) notFound();

  const today = todayInOrgTimeZone();
  const dueKind = unitRow
    ? unitDue(unitRow, { inspectionMonths: organization.gas_inspection_months, revisionMonths: organization.gas_revision_months }, today).kind
    : null;
  const kind: "verificare" | "revizie" = saved?.kind === "revizie" || saved?.kind === "verificare" ? saved.kind : tip === "revizie" ? "revizie" : tip === "verificare" ? "verificare" : dueKind ?? "verificare";

  const unitLabel = unitRow ? `Sc. ${unitRow.stair || "—"}, ap. ${unitRow.apartment}` : job.locations?.address ?? `Lucrarea #${job.display_number}`;
  const address = unitRow
    ? [job.gas_buildings?.address ?? job.gas_buildings?.name, unitRow.stair ? `sc. ${unitRow.stair}` : null, `ap. ${unitRow.apartment}`].filter(Boolean).join(", ")
    : job.locations?.address ?? "";

  // Pre-completare: clientul și adresa din scadențar sau din lucrare, instalatorul din ultima lui fișă.
  const prev = (lastMine?.data ?? {}) as Record<string, unknown>;
  const installer = Object.fromEntries(INSTALLER_KEYS.map((k) => [k, prev[k]]).filter(([, v]) => v));
  const initialData: Record<string, unknown> = saved?.data
    ? (saved.data as Record<string, unknown>)
    : {
        client: unitRow?.owner_name ?? job.clients?.name ?? "",
        adresa: address,
        ultima_lucrare: (kind === "revizie" ? unitRow?.last_revision_on : unitRow?.last_inspection_on) ?? "",
        instalator_nume: profile.full_name ?? "",
        ...installer,
        semnatura_client_nume: unitRow?.owner_name ?? job.clients?.name ?? "",
      };

  return (
    <GasForm
      jobId={id}
      unitId={unitId}
      unitLabel={unitLabel}
      jobLabel={`#${job.display_number} · ${unitLabel}`}
      kind={kind}
      initialData={initialData}
      completed={Boolean(saved?.completed_at)}
      doneHref={unitId ? `/mobil/lucrari/${id}/bloc` : `/mobil/lucrari/${id}`}
    />
  );
}
