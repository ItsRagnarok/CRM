import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { notifyBackOffice } from "@/lib/notify";

export type ComplianceKind = "person" | "device" | "vehicle" | "company";

export const KIND_LABELS: Record<ComplianceKind, string> = {
  person: "Oameni",
  device: "Aparate",
  vehicle: "Mașini",
  company: "Firmă",
};

// Suggestions only; the title is free text, so the firm can use its own names.
export const TITLE_PRESETS: Record<ComplianceKind, string[]> = {
  person: ["Autorizație ANRE", "Legitimație instalator gaze", "Instructaj SSM", "Fișă de aptitudine medicală", "Permis de conducere"],
  device: ["Calibrare / verificare metrologică", "Verificare periodică", "Garanție"],
  vehicle: ["ITP", "RCA", "Rovinietă", "Asigurare CASCO"],
  company: ["Autorizație firmă ANRE", "Atestat", "Asigurare de răspundere", "Alt document"],
};

// Alert when a deadline crosses 60, 30 and 7 days, and again when it is missed (0).
export const ALERT_THRESHOLDS = [60, 30, 7, 0] as const;

export function daysUntil(isoDate: string, today: string) {
  return Math.round((Date.parse(`${isoDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

export type ComplianceLevel = "expired" | "urgent" | "soon" | "watch" | "ok";

export function complianceLevel(daysLeft: number): ComplianceLevel {
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 7) return "urgent";
  if (daysLeft <= 30) return "soon";
  if (daysLeft <= 60) return "watch";
  return "ok";
}

export const LEVEL_STYLE: Record<ComplianceLevel, string> = {
  expired: "bg-danger-bg text-danger",
  urgent: "bg-danger-bg text-danger",
  soon: "bg-warning-bg text-warning",
  watch: "bg-amber-soft text-warning",
  ok: "bg-success-bg text-success",
};

export function daysLabel(daysLeft: number) {
  if (daysLeft < 0) return `expirat de ${-daysLeft} ${-daysLeft === 1 ? "zi" : "zile"}`;
  if (daysLeft === 0) return "expiră azi";
  return `${daysLeft} ${daysLeft === 1 ? "zi" : "zile"}`;
}

/** Smallest threshold the item has reached, or null when it is more than 60 days away. */
export function thresholdFor(daysLeft: number): number | null {
  if (daysLeft < 0) return 0;
  const hit = ALERT_THRESHOLDS.filter((t) => daysLeft <= t);
  return hit.length ? Math.min(...hit) : null;
}

/**
 * Sends one notification (bell + push) per item each time it crosses a threshold,
 * remembering the last one in last_alert_days. Called when the office opens the
 * dashboard or the registry, so no scheduled job is needed.
 */
export async function syncComplianceAlerts(supabase: SupabaseClient<Database>, organizationId: string, today: string) {
  const horizon = new Date(Date.parse(`${today}T00:00:00Z`) + 61 * 86_400_000).toISOString().slice(0, 10);
  const { data: items } = await supabase
    .from("compliance_items")
    .select("id, title, subject, expires_on, last_alert_days")
    .eq("organization_id", organizationId)
    .lte("expires_on", horizon);
  for (const item of items ?? []) {
    const left = daysUntil(item.expires_on, today);
    const threshold = thresholdFor(left);
    if (threshold === null) continue;
    if (item.last_alert_days !== null && item.last_alert_days <= threshold) continue;
    // Claim it first so two open tabs do not both notify.
    const { data: claimed } = await supabase
      .from("compliance_items")
      .update({ last_alert_days: threshold })
      .eq("id", item.id)
      .or(`last_alert_days.is.null,last_alert_days.gt.${threshold}`)
      .select("id");
    if (!claimed?.length) continue;
    await notifyBackOffice(supabase, {
      organizationId,
      type: "compliance_alert",
      title: left < 0 ? `Expirat: ${item.title}` : `Expiră în ${left} zile: ${item.title}`,
      body: `${item.subject} · ${new Date(`${item.expires_on}T12:00:00Z`).toLocaleDateString("ro-RO", { timeZone: "UTC" })}`,
      link: "/conformitate",
    });
  }
}
