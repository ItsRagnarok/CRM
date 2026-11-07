import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { sendPushToProfiles, type PushResult } from "@/lib/push";

export type NotificationType =
  | "message"
  | "call_request"
  | "job_assigned"
  | "job_updated"
  | "job_started"
  | "purchase"
  | "purchase_request"
  | "job_alert"
  | "job_finished"
  | "expense_submitted"
  | "time_off_request"
  | "test";

// Per-category push preferences (profiles.notification_prefs). A missing key
// means "on". The in-app bell always records everything; these only decide
// whether a system push is also sent.
export type PrefKey = "messages" | "calls" | "jobs" | "purchases";

export const PREF_LABELS: Record<PrefKey, { title: string; description: string }> = {
  messages: { title: "Mesaje de la administrator", description: "Un mesaj nou în conversația ta sau a echipei." },
  calls: { title: "Cereri de apel", description: "Administratorul îți cere să suni înapoi." },
  jobs: { title: "Lucrări noi și modificări", description: "Alocări, mutări de program, anulări." },
  purchases: { title: "Achiziții și aprobări", description: "Răspunsul la cererile de materiale." },
};

const PREF_FOR_TYPE: Partial<Record<NotificationType, PrefKey>> = {
  message: "messages",
  call_request: "calls",
  job_assigned: "jobs",
  job_updated: "jobs",
  job_started: "jobs",
  purchase: "purchases",
  purchase_request: "purchases",
  job_alert: "jobs",
  job_finished: "jobs",
  expense_submitted: "purchases",
  time_off_request: "purchases",
};

export function prefEnabled(prefs: unknown, key: PrefKey) {
  return !(prefs && typeof prefs === "object" && (prefs as Record<string, unknown>)[key] === false);
}

// Writes the in-app notification rows and, in addition, a real system push to
// the recipients' registered phones (respecting each person's master switch
// and category preferences). Safe to call unconditionally: push failures are
// reported in the return value and never throw, so the action that triggered
// the notification (message sent, job assigned…) is never blocked by them.
export async function notifyProfiles(
  supabase: SupabaseClient<Database>,
  input: {
    organizationId: string;
    profileIds: string[];
    type: NotificationType;
    title: string;
    body: string;
    jobId?: string | null;
    link?: string | null;
  }
): Promise<PushResult> {
  const profileIds = [...new Set(input.profileIds)];
  if (profileIds.length === 0) return { status: "no_profiles", delivered: 0, devices: 0 };

  const { error } = await supabase.from("notifications").insert(
    profileIds.map((profileId) => ({
      organization_id: input.organizationId,
      profile_id: profileId,
      type: input.type,
      title: input.title,
      body: input.body,
      related_job_id: input.jobId ?? null,
      link: input.link ?? null,
    }))
  );
  if (error) console.error("notify: could not store notifications", error.message);

  const prefKey = PREF_FOR_TYPE[input.type];
  const { data: recipients } = await supabase
    .from("profiles")
    .select("id, notifications_enabled, notification_prefs")
    .in("id", profileIds);

  const pushIds = (recipients ?? [])
    .filter((r) => r.notifications_enabled && (!prefKey || prefEnabled(r.notification_prefs, prefKey)))
    .map((r) => r.id);

  const data: Record<string, string> = { type: input.type };
  if (input.link) data.url = input.link;
  if (input.jobId) data.jobId = input.jobId;

  return sendPushToProfiles(supabase, pushIds, { title: input.title, body: input.body, data });
}

// Tells the office (admins and managers) that something needs their attention:
// a purchase request, a problem report, a finished job, a new expense or a
// leave request. Same guarantees as notifyProfiles — never throws, never blocks
// the action that triggered it. `exceptProfileId` keeps an admin who triggers the
// event themselves from notifying themselves.
export async function notifyBackOffice(
  supabase: SupabaseClient<Database>,
  input: {
    organizationId: string;
    type: NotificationType;
    title: string;
    body: string;
    jobId?: string | null;
    link?: string | null;
    exceptProfileId?: string;
  }
): Promise<PushResult> {
  const { data: office } = await supabase
    .from("profiles")
    .select("id")
    .eq("organization_id", input.organizationId)
    .in("role", ["admin", "manager"])
    .eq("is_active", true);
  const profileIds = (office ?? []).map((p) => p.id).filter((id) => id !== input.exceptProfileId);
  return notifyProfiles(supabase, { ...input, profileIds });
}
