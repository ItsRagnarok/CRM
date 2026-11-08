"use server";

import { revalidatePath } from "next/cache";
import { requireBackOfficeContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasModule } from "@/lib/modules";
import { DOMAINS } from "@/lib/domains";
import type { ComplianceKind } from "@/lib/compliance";

type State = { error?: string; success?: boolean } | undefined;
const KINDS: ComplianceKind[] = ["person", "device", "vehicle", "company"];
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(`${v}T00:00:00Z`));

async function context() {
  const ctx = await requireBackOfficeContext();
  if (!ctx) throw new Error("Doar administratorul sau managerul poate modifica registrul.");
  if (!hasModule(ctx.organization.enabled_modules, "conformitate")) throw new Error("Modulul nu este activ pentru această firmă.");
  return ctx;
}

export async function addComplianceItem(_prev: State, formData: FormData): Promise<State> {
  const { organization, readOnly } = await context();
  if (readOnly) return { error: "Modul de vizualizare nu permite modificări." };
  const kind = String(formData.get("kind") ?? "") as ComplianceKind;
  const title = String(formData.get("title") ?? "").trim();
  let subject = String(formData.get("subject") ?? "").trim();
  const profileId = String(formData.get("profileId") ?? "") || null;
  const domain = String(formData.get("domain") ?? "");
  const issuedOn = String(formData.get("issuedOn") ?? "");
  const expiresOn = String(formData.get("expiresOn") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!KINDS.includes(kind)) return { error: "Alege ce tip de document este." };
  if (!title) return { error: "Scrie numele documentului." };
  if (!isDate(expiresOn)) return { error: "Alege data de expirare." };
  if (issuedOn && !isDate(issuedOn)) return { error: "Data emiterii nu este validă." };
  if (issuedOn && issuedOn > expiresOn) return { error: "Data emiterii e după data de expirare." };

  const supabase = await createClient();
  let linkedProfile: string | null = null;
  if (kind === "person" && profileId) {
    const { data: person } = await supabase.from("profiles").select("id, full_name").eq("id", profileId).eq("organization_id", organization.id).maybeSingle();
    if (!person) return { error: "Persoana aleasă nu a fost găsită." };
    linkedProfile = person.id;
    subject = person.full_name;
  }
  if (!subject) return { error: kind === "person" ? "Alege persoana." : "Completează la ce se referă (denumire, serie sau număr)." };

  const { error } = await supabase.from("compliance_items").insert({
    organization_id: organization.id,
    kind,
    title: title.slice(0, 160),
    subject: subject.slice(0, 160),
    profile_id: linkedProfile,
    domain: DOMAINS.some((d) => d.id === domain) ? (domain as "electric" | "gaze" | "fotovoltaic") : null,
    issued_on: issuedOn || null,
    expires_on: expiresOn,
    notes: notes ? notes.slice(0, 2000) : null,
  });
  if (error) return { error: "Nu am putut salva. Încearcă din nou." };
  revalidatePath("/conformitate");
  return { success: true };
}

export async function renewComplianceItem(formData: FormData) {
  const { organization, readOnly } = await context();
  if (readOnly) return;
  const id = String(formData.get("id") ?? "");
  const expiresOn = String(formData.get("expiresOn") ?? "");
  if (!id || !isDate(expiresOn)) return;
  const supabase = await createClient();
  await supabase.from("compliance_items").update({ expires_on: expiresOn, issued_on: new Date().toISOString().slice(0, 10), last_alert_days: null }).eq("id", id).eq("organization_id", organization.id);
  revalidatePath("/conformitate");
}

export async function deleteComplianceItem(formData: FormData) {
  const { organization, readOnly } = await context();
  if (readOnly) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("compliance_items").delete().eq("id", id).eq("organization_id", organization.id);
  revalidatePath("/conformitate");
}
