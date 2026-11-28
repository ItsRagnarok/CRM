export const PROJECT_KINDS = [
  { id: "seo", label: "SEO" },
  { id: "site", label: "Site" },
  { id: "magazin", label: "Magazin online" },
  { id: "electrofield", label: "ElectroField" },
  { id: "altul", label: "Altceva" },
] as const;

export const PROJECT_STATUSES = [
  { id: "activ", label: "Activ" },
  { id: "asteptare", label: "În așteptare" },
  { id: "incheiat", label: "Încheiat" },
] as const;

export const kindLabel = (id: string) => PROJECT_KINDS.find((k) => k.id === id)?.label ?? "Altceva";
export const statusLabel = (id: string) => PROJECT_STATUSES.find((s) => s.id === id)?.label ?? id;

export type Task = { id: string; project_id: string | null; title: string; details: string | null; due_on: string | null; urgent: boolean; done_at: string | null; created_at: string };

/** Unde cade o sarcină deschisă față de azi: întârziată, azi, săptămâna asta, mai târziu sau fără termen. */
export function taskBucket(t: Task, today: string): "intarziat" | "azi" | "saptamana" | "mai_tarziu" | "fara" {
  if (!t.due_on) return "fara";
  if (t.due_on < today) return "intarziat";
  if (t.due_on === today) return "azi";
  const in7 = new Date(`${today}T12:00:00Z`);
  in7.setUTCDate(in7.getUTCDate() + 7);
  return t.due_on <= in7.toISOString().slice(0, 10) ? "saptamana" : "mai_tarziu";
}

export const dayMonth = (iso: string) => new Intl.DateTimeFormat("ro-RO", { timeZone: "UTC", day: "numeric", month: "short" }).format(new Date(`${iso}T12:00:00Z`));
