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

