import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { computeScheduleWarnings, type ScheduleWarning } from "@/lib/schedule-warnings";
import { isHeightFitness } from "@/lib/ssm";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type WarningRequest = {
  jobId?: string | null;
  teamId?: string | null;
  date: string;
  start?: string | null;
  end?: string | null;
  domain?: string | null;
  /** Materialele bifate în formular (1 bucată fiecare). Fără ele, se iau cele cerute pe lucrare. */
  materialIds?: string[] | null;
  /** Lucrare la înălțime. null/undefined = ia valoarea din lucrare (la editare). */
  atHeight?: boolean | null;
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const norm = (s: string | null | undefined) => (s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Adună din baza de date tot ce trebuie pentru avertizări și le calculează. */
export async function loadScheduleWarnings(supabase: Supabase, org: { id: string; standard_hours_per_day: number | null }, req: WarningRequest): Promise<ScheduleWarning[]> {
  if (!ISO.test(req.date)) return [];
  const jobId = req.jobId && UUID.test(req.jobId) ? req.jobId : null;
  const teamId = req.teamId && UUID.test(req.teamId) ? req.teamId : null;
  const materialIds = (req.materialIds ?? []).filter((id) => UUID.test(id)).slice(0, 100);

  // Cine lucrează: membrii echipei alese; fără echipă, oamenii deja alocați pe lucrare.
  let peopleIds: string[] = [];
  let teamName: string | null = null;
  if (teamId) {
    const [{ data: team }, { data: members }] = await Promise.all([
      supabase.from("teams").select("name").eq("id", teamId).eq("organization_id", org.id).maybeSingle(),
      supabase.from("team_members").select("profile_id").eq("team_id", teamId),
    ]);
    if (!team) return [];
    teamName = team.name;
    peopleIds = (members ?? []).map((m) => m.profile_id);
  } else if (jobId) {
    const { data: assigned } = await supabase.from("job_assignments").select("profile_id").eq("job_id", jobId);
    peopleIds = (assigned ?? []).map((a) => a.profile_id);
  }

  const none = Promise.resolve({ data: [] as never[] });
  const [people, docs, vehicles, leaves, sameDay, required] = await Promise.all([
    peopleIds.length ? supabase.from("profiles").select("id, full_name").in("id", peopleIds).eq("organization_id", org.id).eq("is_active", true) : none,
    peopleIds.length
      ? supabase.from("compliance_items").select("profile_id, title, expires_on, domain").eq("organization_id", org.id).eq("kind", "person").in("profile_id", peopleIds).lt("expires_on", req.date)
      : none,
    teamId ? supabase.from("vehicles").select("id, name, plate_number").eq("organization_id", org.id).eq("assigned_team_id", teamId).eq("is_active", true) : none,
    peopleIds.length
      ? supabase.from("time_off_requests").select("profile_id, start_date, end_date, type").eq("organization_id", org.id).eq("status", "approved").in("profile_id", peopleIds).lte("start_date", req.date).gte("end_date", req.date)
      : none,
    supabase
      .from("jobs")
      .select("id, display_number, title, start_time, end_time, team_id, status, job_assignments(profile_id)")
      .eq("organization_id", org.id)
      .eq("scheduled_date", req.date)
      .neq("status", "anulata")
      .limit(500),
    materialIds.length
      ? Promise.resolve({ data: materialIds.map((id) => ({ material_id: id, quantity_needed: 1, taken: false })) })
      : jobId
        ? supabase.from("job_required_items").select("material_id, quantity_needed, taken").eq("job_id", jobId).not("material_id", "is", null)
        : none,
  ]);

  // Documentele mașinilor: în Conformitate, subiectul e numărul de înmatriculare (sau numele mașinii).
  const vehicleRows = (vehicles.data ?? []) as { id: string; name: string; plate_number: string | null }[];
  let vehicleDocs: { title: string; subject: string; expires_on: string }[] = [];
  if (vehicleRows.length) {
    const { data } = await supabase.from("compliance_items").select("title, subject, expires_on").eq("organization_id", org.id).eq("kind", "vehicle").lt("expires_on", req.date);
    vehicleDocs = data ?? [];
  }

  // Stoc: toate depozitele + mașinile echipei.
  const needed = ((required.data ?? []) as { material_id: string | null; quantity_needed: number; taken: boolean }[]).filter((r) => r.material_id && !r.taken);
  let materials: { name: string; unit: string; needed: number; available: number }[] = [];
  if (needed.length) {
    const ids = [...new Set(needed.map((r) => r.material_id!))];
    const [{ data: mats }, { data: stock }] = await Promise.all([
      supabase.from("materials").select("id, name, unit, kind").eq("organization_id", org.id).in("id", ids),
      supabase.from("material_stock").select("material_id, quantity, warehouse_id, vehicle_id").eq("organization_id", org.id).in("material_id", ids),
    ]);
    const teamVehicles = new Set(vehicleRows.map((v) => v.id));
    const avail = new Map<string, number>();
    for (const s of stock ?? []) {
      if (s.warehouse_id || (s.vehicle_id && teamVehicles.has(s.vehicle_id))) avail.set(s.material_id, (avail.get(s.material_id) ?? 0) + Number(s.quantity));
    }
    const qty = new Map<string, number>();
    for (const r of needed) qty.set(r.material_id!, (qty.get(r.material_id!) ?? 0) + Number(r.quantity_needed || 1));
    materials = (mats ?? []).map((m) => ({ name: m.name, unit: m.unit, needed: qty.get(m.id) ?? 1, available: avail.get(m.id) ?? 0 }));
  }

  // Aparatele de măsură aflate la oamenii lucrării (registrul de scule, calibrarea din Conformitate).
  let devices: { holderId: string; name: string; expiresOn: string | null }[] = [];
  if (peopleIds.length) {
    const { data: tools } = await supabase
      .from("tools")
      .select("name, holder_profile_id, compliance_items(expires_on)")
      .eq("organization_id", org.id)
      .eq("needs_calibration", true)
      .eq("status", "predat")
      .in("holder_profile_id", peopleIds);
    devices = (tools ?? []).filter((t) => t.holder_profile_id).map((t) => ({ holderId: t.holder_profile_id!, name: t.name, expiresOn: t.compliance_items?.expires_on ?? null }));
  }

  // SSM: instruirea (doar dacă firma ține evidența) și aptitudinea pentru înălțime.
  let atHeight = req.atHeight ?? null;
  if (atHeight === null && jobId) {
    const { data: j } = await supabase.from("jobs").select("at_height").eq("id", jobId).maybeSingle();
    atHeight = Boolean(j?.at_height);
  }
  let ssm: { tracked: boolean; people: { profileId: string; due: string | null }[] } | undefined;
  let heightOk: string[] = [];
  if (peopleIds.length) {
    const [{ count }, { data: trainings }, { data: fit }] = await Promise.all([
      supabase.from("ssm_trainings").select("id", { count: "exact", head: true }).eq("organization_id", org.id),
      supabase.from("ssm_trainings").select("profile_id, done_on, next_due").eq("organization_id", org.id).in("profile_id", peopleIds).order("done_on", { ascending: false }),
      atHeight
        ? supabase.from("compliance_items").select("profile_id, title").eq("organization_id", org.id).eq("kind", "person").in("profile_id", peopleIds).gte("expires_on", req.date)
        : Promise.resolve({ data: [] as { profile_id: string | null; title: string }[] }),
    ]);
    const latest = new Map<string, string | null>();
    for (const t of trainings ?? []) if (!latest.has(t.profile_id)) latest.set(t.profile_id, t.next_due);
    ssm = { tracked: (count ?? 0) > 0, people: [...latest].map(([profileId, due]) => ({ profileId, due })) };
    heightOk = (fit ?? []).filter((d) => d.profile_id && isHeightFitness(d.title)).map((d) => d.profile_id!);
  }

  return computeScheduleWarnings({
    date: req.date,
    start: req.start || null,
    end: req.end || null,
    domain: req.domain || null,
    teamName,
    people: ((people.data ?? []) as { id: string; full_name: string }[]).map((p) => ({ id: p.id, name: p.full_name })),
    personDocs: ((docs.data ?? []) as { profile_id: string | null; title: string; expires_on: string; domain: string | null }[])
      .filter((d) => d.profile_id)
      .map((d) => ({ profileId: d.profile_id!, title: d.title, expiresOn: d.expires_on, domain: d.domain })),
    vehicles: vehicleRows.map((v) => ({
      label: v.plate_number || v.name,
      docs: vehicleDocs.filter((d) => [norm(v.plate_number), norm(v.name)].filter(Boolean).includes(norm(d.subject))).map((d) => ({ title: d.title, expiresOn: d.expires_on })),
    })),
    leaves: ((leaves.data ?? []) as { profile_id: string; start_date: string; end_date: string; type: string | null }[]).map((l) => ({ profileId: l.profile_id, start: l.start_date, end: l.end_date, type: l.type })),
    otherJobs: (sameDay.data ?? [])
      .filter((j) => j.id !== jobId)
      .map((j) => ({
        number: j.display_number,
        title: j.title,
        start: j.start_time,
        end: j.end_time,
        assigneeIds: (j.job_assignments ?? []).map((a: { profile_id: string }) => a.profile_id),
        onTeam: Boolean(teamId && j.team_id === teamId),
      })),
    hoursPerDay: Number(org.standard_hours_per_day ?? 8),
    materials,
    devices,
    ssm,
    atHeight: Boolean(atHeight),
    heightOk,
  });
}
