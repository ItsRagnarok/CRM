"use server";

import { revalidatePath } from "next/cache";
import { requireBackOfficeContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasModule } from "@/lib/modules";
import { todayInOrgTimeZone } from "@/lib/date";

type State = { error?: string; success?: string } | undefined;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function context() {
  const ctx = await requireBackOfficeContext();
  if (!ctx) throw new Error("Doar administratorul sau managerul poate modifica măsurătorile.");
  if (!hasModule(ctx.organization.enabled_modules, "buletine_electrice")) throw new Error("Modulul nu este activ pentru această firmă.");
  return ctx;
}
const num = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n < 1e7 ? n : NaN;
};
const back = (jobId: string) => revalidatePath(`/electric/${jobId}`);

export async function addMeasurement(jobId: string, _prev: State, fd: FormData): Promise<State> {
  const { organization } = await context();
  if (!UUID.test(jobId)) return { error: "Lucrare invalidă." };
  const label = String(fd.get("label") ?? "").trim();
  if (!label) return { error: "Scrie tabloul sau circuitul (ex. TG, C14 iluminat)." };
  const [ins, loop, cont] = [num(fd.get("insulation")), num(fd.get("loop")), num(fd.get("continuity"))];
  if ([ins, loop, cont].some((n) => Number.isNaN(n))) return { error: "O valoare măsurată nu e un număr valid." };
  const result = String(fd.get("result") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("electric_measurements").insert({
    organization_id: organization.id, job_id: jobId, label: label.slice(0, 160),
    kind: fd.get("kind") === "tablou" ? "tablou" : "circuit",
    insulation_mohm: ins, loop_ohm: loop, continuity_ohm: cont,
    result: result === "conform" || result === "neconform" ? result : null,
    notes: String(fd.get("notes") ?? "").trim().slice(0, 1000) || null,
  });
  if (error) return { error: "Nu am putut salva măsurătoarea." };
  back(jobId);
  return { success: "Salvat." };
}

export async function deleteMeasurement(fd: FormData) {
  const { organization } = await context();
  const [id, jobId] = [String(fd.get("id") ?? ""), String(fd.get("jobId") ?? "")];
  if (!UUID.test(id) || !UUID.test(jobId)) return;
  const supabase = await createClient();
  await supabase.from("electric_measurements").delete().eq("id", id).eq("organization_id", organization.id);
  back(jobId);
}

export async function addReport(jobId: string, _prev: State, fd: FormData): Promise<State> {
  const { organization } = await context();
  const title = String(fd.get("title") ?? "").trim();
  if (!UUID.test(jobId) || !title) return { error: "Scrie denumirea buletinului sau procesului-verbal." };
  const supabase = await createClient();
  const { error } = await supabase.from("electric_reports").insert({ organization_id: organization.id, job_id: jobId, title: title.slice(0, 160) });
  if (error) return { error: "Nu am putut salva." };
  back(jobId);
  return { success: "Adăugat." };
}

/** A report can only be signed by someone with a valid ANRE authorization in the compliance registry. */
export async function signReport(_prev: State, fd: FormData): Promise<State> {
  const { organization } = await context();
  const [id, jobId, signer] = [String(fd.get("id") ?? ""), String(fd.get("jobId") ?? ""), String(fd.get("signer") ?? "")];
  if (![id, jobId, signer].every((v) => UUID.test(v))) return { error: "Alege semnatarul." };
  if (!hasModule(organization.enabled_modules, "conformitate")) return { error: "Activează modulul „Registru de conformitate”, ca să verific autorizația semnatarului." };
  const supabase = await createClient();
  const today = todayInOrgTimeZone();
  const { data: auth } = await supabase.from("compliance_items").select("id").eq("organization_id", organization.id).eq("kind", "person").eq("profile_id", signer).ilike("title", "%ANRE%").gte("expires_on", today).limit(1);
  if (!auth?.length) return { error: "Persoana aleasă nu are o autorizație ANRE valabilă în registrul de conformitate. Adaug-o acolo sau alege alt semnatar." };
  const { error } = await supabase.from("electric_reports").update({ signer_profile_id: signer, signed_on: today }).eq("id", id).eq("organization_id", organization.id).is("signed_on", null);
  if (error) return { error: "Nu am putut semna." };
  back(jobId);
  return { success: "Semnat." };
}

export async function deleteReport(fd: FormData) {
  const { organization } = await context();
  const [id, jobId] = [String(fd.get("id") ?? ""), String(fd.get("jobId") ?? "")];
  if (!UUID.test(id) || !UUID.test(jobId)) return;
  const supabase = await createClient();
  await supabase.from("electric_reports").delete().eq("id", id).eq("organization_id", organization.id).is("signed_on", null);
  back(jobId);
}

export async function addHidden(jobId: string, _prev: State, fd: FormData): Promise<State> {
  const { organization } = await context();
  const description = String(fd.get("description") ?? "").trim();
  if (!UUID.test(jobId) || !description) return { error: "Descrie lucrarea ascunsă (ex. trasee îngropate în pardoseală)." };
  const supabase = await createClient();
  const { error } = await supabase.from("electric_hidden_works").insert({ organization_id: organization.id, job_id: jobId, description: description.slice(0, 300) });
  if (error) return { error: "Nu am putut salva." };
  back(jobId);
  return { success: "Adăugat." };
}

export async function toggleHidden(fd: FormData) {
  const { organization } = await context();
  const [id, jobId] = [String(fd.get("id") ?? ""), String(fd.get("jobId") ?? "")];
  if (!UUID.test(id) || !UUID.test(jobId)) return;
  const supabase = await createClient();
  await supabase.from("electric_hidden_works").update({ documented: fd.get("documented") === "1" }).eq("id", id).eq("organization_id", organization.id);
  back(jobId);
}

export async function deleteHidden(fd: FormData) {
  const { organization } = await context();
  const [id, jobId] = [String(fd.get("id") ?? ""), String(fd.get("jobId") ?? "")];
  if (!UUID.test(id) || !UUID.test(jobId)) return;
  const supabase = await createClient();
  await supabase.from("electric_hidden_works").delete().eq("id", id).eq("organization_id", organization.id);
  back(jobId);
}
