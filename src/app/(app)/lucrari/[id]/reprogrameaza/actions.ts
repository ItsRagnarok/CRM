"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBackOfficeContext } from "@/lib/auth";
import { notifyProfiles } from "@/lib/notify";
import { RESCHEDULE_REASONS, rescheduleMessage, longDate, type RescheduleReason } from "@/lib/service-requests";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const HM = /^\d{2}:\d{2}$/;

export type RescheduleResult =
  | { error: string }
  | { ok: true; message: string; phone: string | null; email: string | null; clientName: string | null };

/** Mută lucrarea, păstrează motivul în istoric, anunță echipa și întoarce mesajul pentru client. */
export async function rescheduleWithReason(jobId: string, _prev: RescheduleResult | undefined, fd: FormData): Promise<RescheduleResult> {
  const ctx = await requireBackOfficeContext();
  if (!ctx) return { error: "Doar biroul poate reprograma lucrări." };
  if (!UUID.test(jobId)) return { error: "Lucrare invalidă." };
  const date = String(fd.get("date") ?? "");
  const start = String(fd.get("start") ?? "");
  const end = String(fd.get("end") ?? "");
  const reason = String(fd.get("reason") ?? "") as RescheduleReason;
  const note = String(fd.get("note") ?? "").trim().slice(0, 500);
  if (!ISO.test(date)) return { error: "Alege noua dată." };
  if (start && !HM.test(start)) return { error: "Ora de început nu e validă." };
  if (end && (!HM.test(end) || (start && end <= start))) return { error: "Ora de sfârșit trebuie să fie după ora de început." };
  if (!RESCHEDULE_REASONS.some((r) => r.id === reason)) return { error: "Alege motivul reprogramării." };
  if (reason === "altul" && note.length < 3) return { error: "Scrie pe scurt motivul." };

  const supabase = await createClient();
  const orgId = ctx.organization.id;
  const { data: job } = await supabase
    .from("jobs")
    .select("id, display_number, title, status, scheduled_date, start_time, end_time, clients(name, phone, email), job_assignments(profile_id)")
    .eq("id", jobId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!job) return { error: "Lucrarea nu a fost găsită." };
  if (job.status === "finalizata" || job.status === "anulata") return { error: "Lucrarea e deja încheiată." };

  const { error } = await supabase
    .from("jobs")
    .update({ scheduled_date: date, start_time: start || null, end_time: end || null })
    .eq("id", jobId)
    .eq("organization_id", orgId);
  if (error) return { error: "Nu am putut muta lucrarea." };

  await supabase.from("job_reschedules").insert({
    organization_id: orgId,
    job_id: jobId,
    from_date: job.scheduled_date,
    from_start: job.start_time,
    to_date: date,
    to_start: start || null,
    to_end: end || null,
    reason,
    note: note || null,
    created_by: ctx.userId,
  });

  const reasonLabel = RESCHEDULE_REASONS.find((r) => r.id === reason)?.label ?? "";
  await notifyProfiles(supabase, {
    organizationId: orgId,
    profileIds: (job.job_assignments ?? []).map((a) => a.profile_id).filter((id) => id !== ctx.userId),
    type: "job_updated",
    title: "Lucrare reprogramată",
    body: `#${job.display_number} · ${job.title} — se mută pe ${longDate(date)}${start ? `, ${start}` : ""} (${reason === "altul" ? note : reasonLabel})`,
    jobId,
    link: `/mobil/lucrari/${jobId}`,
  });

  revalidatePath(`/lucrari/${jobId}`);
  revalidatePath("/calendar");
  revalidatePath("/lucrari");
  revalidatePath("/dashboard");
  revalidatePath("/mobil");

  return {
    ok: true,
    clientName: job.clients?.name ?? null,
    phone: job.clients?.phone ?? null,
    email: job.clients?.email ?? null,
    message: rescheduleMessage({
      clientName: job.clients?.name ?? null,
      jobNumber: job.display_number,
      jobTitle: job.title,
      fromDate: job.scheduled_date,
      toDate: date,
      toStart: start || null,
      toEnd: end || null,
      reason,
      note,
      companyName: ctx.organization.name,
      companyPhone: ctx.organization.phone,
    }),
  };
}
