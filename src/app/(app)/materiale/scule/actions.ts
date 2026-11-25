"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireBackOfficeContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notifyProfiles } from "@/lib/notify";
import { TOOL_CATEGORIES, CONDITIONS } from "@/lib/tools";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const txt = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
const cond = (v: string) => (CONDITIONS.some((c) => c.id === v) ? v : "buna");
const back = (extra = "") => `/materiale/scule${extra}`;

function refresh() {
  revalidatePath("/materiale/scule");
  revalidatePath("/conformitate");
  revalidatePath("/mobil/scule");
}

/** Sculă nouă; aparatele cu calibrare primesc și documentul în Conformitate (tip Aparat). */
export async function addTool(fd: FormData) {
  const ctx = await requireBackOfficeContext();
  if (!ctx) return;
  const name = txt(fd, "name", 160);
  const category = txt(fd, "category", 20);
  const serial = txt(fd, "serial", 80) || null;
  const valueRaw = txt(fd, "value", 20).replace(",", ".");
  const value = valueRaw ? Number(valueRaw) : null;
  const needs = fd.get("needsCalibration") === "on";
  const expires = txt(fd, "calibrationExpires", 10);
  const issued = txt(fd, "calibrationIssued", 10);
  if (!name) redirect(back("?eroare=nume"));
  if (value !== null && (!Number.isFinite(value) || value < 0)) redirect(back("?eroare=valoare"));
  if (needs && !ISO.test(expires)) redirect(back("?eroare=calibrare-data"));
  const supabase = await createClient();
  let complianceId: string | null = null;
  if (needs) {
    const { data: ci } = await supabase
      .from("compliance_items")
      .insert({ organization_id: ctx.organization.id, kind: "device", title: "Verificare metrologică / calibrare", subject: `${name}${serial ? ` · SN ${serial}` : ""}`.slice(0, 160), issued_on: ISO.test(issued) ? issued : null, expires_on: expires, notes: "Din registrul de scule", created_by: ctx.userId })
      .select("id")
      .single();
    complianceId = ci?.id ?? null;
  }
  const { error } = await supabase.from("tools").insert({
    organization_id: ctx.organization.id,
    name,
    category: TOOL_CATEGORIES.some((c) => c.id === category) ? category : "altele",
    serial,
    inventory_code: txt(fd, "inventoryCode", 40) || null,
    value,
    needs_calibration: needs,
    compliance_item_id: complianceId,
    notes: txt(fd, "notes", 1000) || null,
    created_by: ctx.userId,
  });
  if (error) redirect(back("?eroare=salvare"));
  refresh();
  redirect(back("?adaugat=1"));
}

/** Predă scula; un aparat cu calibrarea expirată cere confirmare explicită („Predau oricum”). */
export async function handoverTool(fd: FormData) {
  const ctx = await requireBackOfficeContext();
  const toolId = txt(fd, "toolId", 40);
  const to = txt(fd, "profileId", 40);
  const vehicle = txt(fd, "vehicleId", 40);
  if (!ctx || !UUID.test(toolId)) return;
  if (!UUID.test(to)) redirect(back(`?eroare=persoana#t-${toolId}`));
  const supabase = await createClient();
  const { error } = await supabase.rpc("tool_handover", {
    p_tool: toolId, p_to: to, p_vehicle: UUID.test(vehicle) ? vehicle : null,
    p_condition: cond(txt(fd, "condition", 10)), p_note: txt(fd, "note", 500), p_force: fd.get("force") === "on",
  });
  if (error) redirect(back(`?eroare=${error.message.includes("calibrare_expirata") ? "calibrare" : "predare"}&t=${toolId}#t-${toolId}`));
  const { data: tool } = await supabase.from("tools").select("name").eq("id", toolId).maybeSingle();
  await notifyProfiles(supabase, {
    organizationId: ctx.organization.id,
    profileIds: [to],
    type: "tool_handover",
    title: "Ți s-a predat o sculă",
    body: `${tool?.name ?? "Sculă"}: confirmă în aplicație că ai primit-o și în ce stare e.`,
    link: "/mobil/scule",
  });
  refresh();
  redirect(back(`?predat=1#t-${toolId}`));
}

/** Biroul primește scula înapoi (cu starea ei). Defectă → intră în service. */
export async function receiveTool(fd: FormData) {
  const ctx = await requireBackOfficeContext();
  const toolId = txt(fd, "toolId", 40);
  if (!ctx || !UUID.test(toolId)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("tool_receive", { p_tool: toolId, p_condition: cond(txt(fd, "condition", 10)), p_note: txt(fd, "note", 500) });
  if (error) redirect(back(`?eroare=primire#t-${toolId}`));
  refresh();
  redirect(back(`?primit=1#t-${toolId}`));
}

/** Calibrare nouă: actualizează documentul din Conformitate (sau îl creează). */
export async function recalibrateTool(fd: FormData) {
  const ctx = await requireBackOfficeContext();
  const toolId = txt(fd, "toolId", 40);
  const expires = txt(fd, "expires", 10);
  const issued = txt(fd, "issued", 10);
  if (!ctx || !UUID.test(toolId)) return;
  if (!ISO.test(expires)) redirect(back(`?eroare=calibrare-data#t-${toolId}`));
  const supabase = await createClient();
  const { data: t } = await supabase.from("tools").select("name, serial, compliance_item_id").eq("id", toolId).eq("organization_id", ctx.organization.id).maybeSingle();
  if (!t) return;
  if (t.compliance_item_id) {
    await supabase.from("compliance_items").update({ expires_on: expires, issued_on: ISO.test(issued) ? issued : null, last_alert_days: null }).eq("id", t.compliance_item_id);
  } else {
    const { data: ci } = await supabase
      .from("compliance_items")
      .insert({ organization_id: ctx.organization.id, kind: "device", title: "Verificare metrologică / calibrare", subject: `${t.name}${t.serial ? ` · SN ${t.serial}` : ""}`.slice(0, 160), issued_on: ISO.test(issued) ? issued : null, expires_on: expires, notes: "Din registrul de scule", created_by: ctx.userId })
      .select("id")
      .single();
    await supabase.from("tools").update({ compliance_item_id: ci?.id ?? null, needs_calibration: true }).eq("id", toolId);
  }
  refresh();
  redirect(back(`?calibrat=1#t-${toolId}`));
}

/** Scoasă din uz (pierdută / casată) sau înapoi în depozit din service. */
export async function setToolStatus(fd: FormData) {
  const ctx = await requireBackOfficeContext();
  const toolId = txt(fd, "toolId", 40);
  const status = txt(fd, "status", 20);
  if (!ctx || !UUID.test(toolId) || !["disponibil", "pierdut", "casat"].includes(status)) return;
  const supabase = await createClient();
  await supabase
    .from("tools")
    .update({ status, ...(status === "disponibil" ? { condition: "buna" } : {}), ...(status !== "disponibil" ? { holder_profile_id: null, holder_vehicle_id: null } : {}) })
    .eq("id", toolId)
    .eq("organization_id", ctx.organization.id);
  refresh();
  redirect(back(`#t-${toolId}`));
}
