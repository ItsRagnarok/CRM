"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBackOfficeContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasModule } from "@/lib/modules";
import { parseUnits, parseDate, CONTACT_STATUSES } from "@/lib/gas";
import { todayInOrgTimeZone } from "@/lib/date";

type State = { error?: string; success?: string } | undefined;

async function context() {
  const ctx = await requireBackOfficeContext();
  if (!ctx) throw new Error("Doar administratorul sau managerul poate modifica scadențarul.");
  if (!hasModule(ctx.organization.enabled_modules, "scadentar_gaze")) throw new Error("Modulul nu este activ pentru această firmă.");
  return ctx;
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function addBuilding(_prev: State, formData: FormData): Promise<State> {
  const { organization } = await context();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!name) return { error: "Scrie numele blocului (ex. Bl. A4)." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("gas_buildings").insert({ organization_id: organization.id, name: name.slice(0, 160), address: address ? address.slice(0, 300) : null }).select("id").single();
  if (error || !data) return { error: "Nu am putut salva blocul." };
  revalidatePath("/gaze");
  redirect(`/gaze/${data.id}`);
}

export async function deleteBuilding(formData: FormData) {
  const { organization } = await context();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  await supabase.from("gas_buildings").delete().eq("id", id).eq("organization_id", organization.id);
  revalidatePath("/gaze");
  redirect("/gaze");
}

export async function importUnits(buildingId: string, _prev: State, formData: FormData): Promise<State> {
  const { organization } = await context();
  if (!UUID.test(buildingId)) return { error: "Bloc invalid." };
  const { rows, errors } = parseUnits(String(formData.get("data") ?? ""));
  if (errors.length) return { error: errors.slice(0, 6).join(" ") + (errors.length > 6 ? ` (+${errors.length - 6} alte erori)` : "") };
  if (!rows.length) return { error: "Nu am găsit niciun apartament." };
  const supabase = await createClient();
  const { data: building } = await supabase.from("gas_buildings").select("id").eq("id", buildingId).eq("organization_id", organization.id).maybeSingle();
  if (!building) return { error: "Blocul nu a fost găsit." };
  const { error } = await supabase.from("gas_units").upsert(
    rows.map((r) => ({ ...r, organization_id: organization.id, building_id: buildingId })),
    { onConflict: "building_id,stair,apartment" },
  );
  if (error) return { error: "Nu am putut importa. Verifică datele și încearcă din nou." };
  revalidatePath(`/gaze/${buildingId}`);
  return { success: `${rows.length} apartamente importate sau actualizate.` };
}

export async function addUnit(buildingId: string, _prev: State, formData: FormData): Promise<State> {
  const { organization } = await context();
  if (!UUID.test(buildingId)) return { error: "Bloc invalid." };
  const apartment = String(formData.get("apartment") ?? "").trim();
  if (!apartment) return { error: "Scrie apartamentul." };
  const insp = parseDate(String(formData.get("lastInspection") ?? ""));
  const rev = parseDate(String(formData.get("lastRevision") ?? ""));
  if (insp === undefined || rev === undefined) return { error: "Una dintre date nu e validă." };
  const supabase = await createClient();
  const { error } = await supabase.from("gas_units").insert({
    organization_id: organization.id, building_id: buildingId,
    stair: String(formData.get("stair") ?? "").trim().slice(0, 40), apartment: apartment.slice(0, 40),
    owner_name: String(formData.get("owner") ?? "").trim().slice(0, 160) || null,
    phone: String(formData.get("phone") ?? "").trim().slice(0, 40) || null,
    last_inspection_on: insp, last_revision_on: rev,
  });
  if (error) return { error: error.code === "23505" ? "Apartamentul există deja în acest bloc." : "Nu am putut salva." };
  revalidatePath(`/gaze/${buildingId}`);
  return { success: "Apartament adăugat." };
}

export async function updateUnitStatus(formData: FormData) {
  const { organization } = await context();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const scheduled = parseDate(String(formData.get("scheduledOn") ?? ""));
  if (!UUID.test(id) || !CONTACT_STATUSES.some((s) => s.id === status) || scheduled === undefined) return;
  const supabase = await createClient();
  const { data } = await supabase.from("gas_units").update({ contact_status: status, scheduled_on: status === "programat" ? scheduled : null }).eq("id", id).eq("organization_id", organization.id).select("building_id").maybeSingle();
  if (data) revalidatePath(`/gaze/${data.building_id}`);
}

export async function markUnitDone(formData: FormData) {
  const { organization } = await context();
  const id = String(formData.get("id") ?? "");
  const kind = String(formData.get("kind") ?? "");
  if (!UUID.test(id) || (kind !== "verificare" && kind !== "revizie")) return;
  const today = todayInOrgTimeZone();
  const supabase = await createClient();
  const patch = kind === "verificare" ? { last_inspection_on: today } : { last_revision_on: today };
  const { data } = await supabase.from("gas_units").update({ ...patch, contact_status: "efectuat", scheduled_on: null }).eq("id", id).eq("organization_id", organization.id).select("building_id").maybeSingle();
  if (data) revalidatePath(`/gaze/${data.building_id}`);
}

export async function deleteUnit(formData: FormData) {
  const { organization } = await context();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  const { data } = await supabase.from("gas_units").delete().eq("id", id).eq("organization_id", organization.id).select("building_id").maybeSingle();
  if (data) revalidatePath(`/gaze/${data.building_id}`);
}

export async function updateGasSettings(_prev: State, formData: FormData): Promise<State> {
  const ctx = await context();
  if (ctx.profile.role !== "admin") return { error: "Doar administratorul poate schimba termenele." };
  const inspection = Number(formData.get("inspectionMonths"));
  const revision = Number(formData.get("revisionMonths"));
  if (!Number.isInteger(inspection) || inspection < 1 || inspection > 240 || !Number.isInteger(revision) || revision < 1 || revision > 360) return { error: "Introdu numere întregi de luni (1–240 și 1–360)." };
  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update({ gas_inspection_months: inspection, gas_revision_months: revision }).eq("id", ctx.organization.id);
  if (error) return { error: "Nu am putut salva termenele." };
  revalidatePath("/gaze");
  return { success: "Termene salvate." };
}
