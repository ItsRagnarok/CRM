// Registrul de scule: etichete și starea calibrării (aparatele de măsură, din Conformitate).

export const TOOL_CATEGORIES = [
  { id: "aparat", label: "Aparat de măsură" },
  { id: "scula", label: "Sculă electrică" },
  { id: "scara", label: "Scară / schelă" },
  { id: "echipament", label: "Echipament de protecție" },
  { id: "altele", label: "Altele" },
] as const;
export const CONDITIONS = [
  { id: "buna", label: "Bună" },
  { id: "uzata", label: "Uzată" },
  { id: "defecta", label: "Defectă" },
] as const;
export const TOOL_STATUS: Record<string, string> = { disponibil: "În depozit", predat: "La om", service: "În service", pierdut: "Pierdută", casat: "Casată" };
export const categoryLabel = (id: string) => TOOL_CATEGORIES.find((c) => c.id === id)?.label ?? "Altele";
export const conditionLabel = (id: string | null | undefined) => CONDITIONS.find((c) => c.id === id)?.label ?? "—";

export type CalibrationState = "expirata" | "expira" | "ok" | "lipsa" | null;

/** null = nu are nevoie de calibrare; „lipsa” = are nevoie, dar nu e trecută în Conformitate. */
export function calibrationState(needs: boolean, expiresOn: string | null | undefined, today: string, warnDays = 30): CalibrationState {
  if (!needs) return null;
  if (!expiresOn) return "lipsa";
  if (expiresOn < today) return "expirata";
  const days = Math.round((Date.parse(`${expiresOn}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
  return days <= warnDays ? "expira" : "ok";
}

export const CALIBRATION_LABEL: Record<Exclude<CalibrationState, null>, string> = {
  expirata: "Calibrare expirată",
  expira: "Calibrarea expiră curând",
  ok: "Calibrat",
  lipsa: "Fără dată de calibrare",
};
