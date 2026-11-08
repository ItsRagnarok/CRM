"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBackOfficeContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasModule } from "@/lib/modules";
import { parseDate } from "@/lib/gas";
import { STAGES } from "@/lib/pv";
import type { Database } from "@/lib/supabase/database.types";

type ProjectPatch = Database["public"]["Tables"]["pv_projects"]["Update"];

type State = { error?: string; success?: string } | undefined;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_FIELDS = ["offer_sent_on", "contract_signed_on", "advance_received_on", "install_on", "atr_filed_on", "atr_received_on", "cert_requested_on", "cert_received_on", "afm_filed_on", "afm_paid_on", "warranty_until"] as const;

async function context() {
  const ctx = await requireBackOfficeContext();
  if (!ctx) throw new Error("Doar administratorul sau managerul poate modifica dosarele.");
  if (!hasModule(ctx.organization.enabled_modules, "dosar_fotovoltaic")) throw new Error("Modulul nu este activ pentru această firmă.");
  return ctx;
}
const text = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max) || null;

export async function addProject(_prev: State, formData: FormData): Promise<State> {
  const { organization } = await context();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Scrie numele dosarului (ex. Casa Ionescu 8,8 kWp)." };
  const kwpRaw = String(formData.get("kwp") ?? "").trim().replace(",", ".");
  const kwp = kwpRaw ? Number(kwpRaw) : null;
  if (kwp !== null && (!Number.isFinite(kwp) || kwp <= 0 || kwp >= 100000)) return { error: "Puterea (kWp) nu e validă." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("pv_projects").insert({
    organization_id: organization.id, name: name.slice(0, 160), address: text(formData, "address", 300),
    contact_name: text(formData, "contactName", 160), contact_phone: text(formData, "contactPhone", 40), kwp,
  }).select("id").single();
  if (error || !data) return { error: "Nu am putut salva dosarul." };
  revalidatePath("/fotovoltaic");
  redirect(`/fotovoltaic/${data.id}`);
}

export async function saveProject(id: string, _prev: State, formData: FormData): Promise<State> {
  const { organization } = await context();
  if (!UUID.test(id)) return { error: "Dosar invalid." };
  const name = String(formData.get("name") ?? "").trim();
  const stage = String(formData.get("stage") ?? "");
  if (!name) return { error: "Numele dosarului nu poate fi gol." };
  if (!STAGES.some((s) => s.id === stage)) return { error: "Etapă invalidă." };
  const kwpRaw = String(formData.get("kwp") ?? "").trim().replace(",", ".");
  const kwp = kwpRaw ? Number(kwpRaw) : null;
  if (kwp !== null && (!Number.isFinite(kwp) || kwp <= 0 || kwp >= 100000)) return { error: "Puterea (kWp) nu e validă." };
  const patch: ProjectPatch = {
    name: name.slice(0, 160), stage, kwp,
    address: text(formData, "address", 300), contact_name: text(formData, "contactName", 160), contact_phone: text(formData, "contactPhone", 40),
    operator_name: text(formData, "operatorName", 160), atr_number: text(formData, "atrNumber", 80), notes: text(formData, "notes", 4000),
  };
  for (const f of DATE_FIELDS) {
    const v = parseDate(String(formData.get(f) ?? ""));
    if (v === undefined) return { error: "Una dintre date nu e validă." };
    patch[f] = v;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("pv_projects").update(patch).eq("id", id).eq("organization_id", organization.id);
  if (error) return { error: "Nu am putut salva modificările." };
  revalidatePath(`/fotovoltaic/${id}`);
  revalidatePath("/fotovoltaic");
  return { success: "Salvat." };
}

export async function moveStage(formData: FormData) {
  const { organization } = await context();
  const id = String(formData.get("id") ?? "");
  const stage = String(formData.get("stage") ?? "");
  if (!UUID.test(id) || !STAGES.some((s) => s.id === stage)) return;
  const supabase = await createClient();
  await supabase.from("pv_projects").update({ stage }).eq("id", id).eq("organization_id", organization.id);
  revalidatePath("/fotovoltaic");
}

export async function deleteProject(formData: FormData) {
  const { organization } = await context();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  await supabase.from("pv_projects").delete().eq("id", id).eq("organization_id", organization.id);
  revalidatePath("/fotovoltaic");
  redirect("/fotovoltaic");
}

export async function savePvSettings(_prev: State, formData: FormData): Promise<State> {
  const ctx = await context();
  if (ctx.profile.role !== "admin") return { error: "Doar administratorul poate schimba termenele." };
  const atr = Number(formData.get("atrDays")), cert = Number(formData.get("certDays"));
  if (![atr, cert].every((n) => Number.isInteger(n) && n >= 1 && n <= 365)) return { error: "Introdu numere întregi de zile (1–365)." };
  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update({ pv_atr_days: atr, pv_cert_days: cert }).eq("id", ctx.organization.id);
  if (error) return { error: "Nu am putut salva termenele." };
  revalidatePath("/fotovoltaic");
  return { success: "Termene salvate." };
}
