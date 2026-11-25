"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBackOfficeContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notifyProfiles } from "@/lib/notify";
import { PHASES, nextDue } from "@/lib/ssm";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Instruire pentru unul sau mai mulți oameni (o sesiune); fiecare primește notificare să confirme. */
export async function addTraining(_prev: { ok?: boolean; error?: string } | undefined, fd: FormData) {
  const ctx = await requireBackOfficeContext();
  if (!ctx) return { error: "Doar biroul înregistrează instruirile." };
  const people = fd.getAll("people").map(String).filter((id) => UUID.test(id));
  const phase = String(fd.get("phase") ?? "");
  const doneOn = String(fd.get("doneOn") ?? "");
  if (!people.length) return { error: "Alege cel puțin un om." };
  if (!PHASES.some((p) => p.id === phase)) return { error: "Alege tipul instruirii." };
  if (!ISO.test(doneOn)) return { error: "Alege data instruirii." };
  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles").select("id, role").eq("organization_id", ctx.organization.id).in("id", people);
  const duration = Number(fd.get("duration"));
  const rows = (profiles ?? []).map((p) => ({
    organization_id: ctx.organization.id,
    profile_id: p.id,
    phase,
    done_on: doneOn,
    next_due: nextDue(doneOn, p.role),
    instructor: String(fd.get("instructor") ?? "").trim().slice(0, 120) || null,
    topic: String(fd.get("topic") ?? "").trim().slice(0, 300) || null,
    duration_minutes: Number.isInteger(duration) && duration >= 5 && duration <= 960 ? duration : null,
  }));
  if (!rows.length) return { error: "Oamenii aleși nu sunt din firmă." };
  const { error } = await supabase.from("ssm_trainings").insert(rows);
  if (error) return { error: "Nu am putut salva instruirea." };
  await notifyProfiles(supabase, {
    organizationId: ctx.organization.id,
    profileIds: rows.map((r) => r.profile_id).filter((id) => id !== ctx.userId),
    type: "ssm_training",
    title: "Instruire SSM de confirmat",
    body: `${PHASES.find((p) => p.id === phase)?.label} din ${doneOn.split("-").reverse().join(".")}. Confirm-o în aplicație.`,
    link: "/mobil/ssm",
  });
  revalidatePath("/ssm");
  return { ok: true };
}

/** Șterge o instruire greșită (doar dacă omul nu a confirmat-o încă). */
export async function deleteTraining(fd: FormData) {
  const ctx = await requireBackOfficeContext();
  const id = String(fd.get("id") ?? "");
  if (!ctx || !UUID.test(id)) return;
  const supabase = await createClient();
  await supabase.from("ssm_trainings").delete().eq("id", id).eq("organization_id", ctx.organization.id).is("confirmed_at", null);
  revalidatePath("/ssm");
}

/** Biroul cercetează incidentul: stare și măsura luată. */
export async function updateIncident(fd: FormData) {
  const ctx = await requireBackOfficeContext();
  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "");
  if (!ctx || !UUID.test(id) || !["nou", "cercetat", "inchis"].includes(status)) return;
  const supabase = await createClient();
  await supabase
    .from("ssm_incidents")
    .update({
      status,
      measures: String(fd.get("measures") ?? "").trim().slice(0, 1000) || null,
      closed_by: status === "inchis" ? ctx.userId : null,
      closed_at: status === "inchis" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("organization_id", ctx.organization.id);
  revalidatePath("/ssm");
  redirect("/ssm?tab=incidente&salvat=1");
}
