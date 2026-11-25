"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { orgLocalToIso } from "@/lib/time-corrections";
import { notifyBackOffice } from "@/lib/notify";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type State = { error?: string } | undefined;

export async function requestTimeCorrection(_prev: State, formData: FormData): Promise<State> {
  const { organization, userId, readOnly, profile } = await requireSessionContext();
  if (readOnly) return { error: "Modul de vizualizare nu permite modificări." };
  const jobId = String(formData.get("jobId") ?? "");
  const event = String(formData.get("event") ?? "");
  const entryId = String(formData.get("entryId") ?? "");
  const day = String(formData.get("day") ?? "");
  const time = String(formData.get("time") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!UUID.test(jobId) || (event !== "work_start" && event !== "work_end")) return { error: "Cerere invalidă." };
  if (entryId && !UUID.test(entryId)) return { error: "Cerere invalidă." };
  const at = orgLocalToIso(day, time);
  if (!at) return { error: "Alege ora corectă." };
  const when = new Date(at).getTime();
  if (when > Date.now() + 5 * 60_000) return { error: "Ora nu poate fi în viitor." };
  if (when < Date.now() - 31 * 86_400_000) return { error: "Poți corecta doar ultimele 31 de zile. Pentru ceva mai vechi, vorbește cu biroul." };
  if (reason.length < 5) return { error: "Scrie pe scurt motivul (cel puțin 5 caractere)." };

  const supabase = await createClient();
  let originalAt: string | null = null;
  if (entryId) {
    const { data: entry } = await supabase.from("time_entries").select("occurred_at").eq("id", entryId).eq("profile_id", userId).maybeSingle();
    if (!entry) return { error: "Nu găsesc înregistrarea de pontaj." };
    originalAt = entry.occurred_at;
  }
  const { data: pending } = await supabase
    .from("time_corrections").select("id").eq("profile_id", userId).eq("job_id", jobId).eq("event_type", event).eq("status", "pending").limit(1);
  if (pending?.length) return { error: "Ai deja o corecție în așteptare pentru această oră. Retrage-o întâi dacă vrei alta." };

  const { error } = await supabase.from("time_corrections").insert({
    organization_id: organization.id,
    profile_id: userId,
    job_id: jobId,
    event_type: event,
    entry_id: entryId || null,
    original_at: originalAt,
    requested_at: at,
    reason: reason.slice(0, 500),
  });
  if (error) return { error: "Nu am putut trimite cererea. Verifică dacă lucrarea e a ta și încearcă din nou." };

  await notifyBackOffice(supabase, {
    organizationId: organization.id,
    type: "time_correction",
    title: "Corecție de pontaj",
    body: `${profile.full_name ?? "Un tehnician"} cere corectarea unei ore: ${reason.slice(0, 120)}`,
    jobId,
    link: "/pontaj#corectii",
  }).catch(() => {});

  revalidatePath("/mobil/pontaj");
  revalidatePath("/pontaj");
  redirect(`/mobil/pontaj?trimis=1`);
}

export async function withdrawTimeCorrection(formData: FormData) {
  const { userId } = await requireSessionContext();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  await supabase.from("time_corrections").delete().eq("id", id).eq("profile_id", userId).eq("status", "pending");
  revalidatePath("/mobil/pontaj");
  revalidatePath("/pontaj");
}
