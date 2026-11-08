import { daysUntil } from "@/lib/compliance";

export const STAGES = [
  { id: "oferta", label: "Ofertă" },
  { id: "contract", label: "Contract și avans" },
  { id: "montaj", label: "Montaj" },
  { id: "atr", label: "ATR / avize" },
  { id: "punere_in_functiune", label: "Punere în funcțiune" },
  { id: "afm_garantie", label: "AFM / garanție" },
  { id: "finalizat", label: "Finalizat" },
  { id: "anulat", label: "Anulat" },
] as const;
export type StageId = (typeof STAGES)[number]["id"];
export const BOARD_STAGES = STAGES.filter((s) => s.id !== "anulat");
export const stageLabel = (id: string) => STAGES.find((s) => s.id === id)?.label ?? id;

export type PvDates = {
  atr_filed_on: string | null;
  atr_received_on: string | null;
  cert_requested_on: string | null;
  cert_received_on: string | null;
  afm_filed_on: string | null;
  afm_paid_on: string | null;
};

export type Clock = { key: "atr" | "cert" | "afm"; label: string; since: string; elapsed: number; termDays: number | null; left: number | null; overdue: boolean };

/** Open waits on third parties. The operator terms are the company's own settings. */
export function openClocks(p: PvDates, terms: { atrDays: number; certDays: number }, today: string): Clock[] {
  const out: Clock[] = [];
  const add = (key: Clock["key"], label: string, since: string | null, done: string | null, termDays: number | null) => {
    if (!since || done) return;
    const elapsed = -daysUntil(since, today);
    const left = termDays === null ? null : termDays - elapsed;
    out.push({ key, label, since, elapsed, termDays, left, overdue: left !== null && left < 0 });
  };
  add("atr", "Aviz tehnic de racordare (ATR)", p.atr_filed_on, p.atr_received_on, terms.atrDays);
  add("cert", "Certificat de racordare", p.cert_requested_on, p.cert_received_on, terms.certDays);
  add("afm", "Decontare AFM", p.afm_filed_on, p.afm_paid_on, null);
  return out;
}

const ro = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("ro-RO", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" });

/** A factual draft: what was filed, when, the term the company works with, and what is asked. No accusations. */
export function complaintDraft(opts: { clock: Clock; project: { name: string; address: string | null; operator_name: string | null; atr_number: string | null; contact_name: string | null }; company: string; today: string }) {
  const { clock, project, company, today } = opts;
  const what = clock.key === "atr" ? "avizului tehnic de racordare (ATR)" : "certificatului de racordare";
  const request = clock.key === "atr" ? "avizul tehnic de racordare (ATR)" : "certificatul de racordare";
  const term = clock.termDays ? `termenul de ${clock.termDays} zile` : "termenul aplicabil";
  return [
    `Către: ${project.operator_name || "[operatorul de distribuție]"}`,
    `Data: ${ro(today)}`,
    "",
    `Subiect: Solicitare de informații privind emiterea ${what}${project.atr_number ? `, dosar nr. ${project.atr_number}` : ""}`,
    "",
    `Bună ziua,`,
    "",
    `Vă scriem în numele ${project.contact_name ? `domnului/doamnei ${project.contact_name}` : "beneficiarului"}, pentru instalația fotovoltaică „${project.name}”${project.address ? `, la adresa ${project.address}` : ""}.`,
    `Cererea pentru ${request} a fost depusă la data de ${ro(clock.since)}${project.atr_number ? ` (număr de înregistrare ${project.atr_number})` : ""}. De la depunere au trecut ${clock.elapsed} zile, iar ${term} (pe care îl folosim ca reper) ${clock.overdue ? "a fost depășit" : "se apropie de final"}.`,
    "",
    `Vă rugăm să ne comunicați stadiul solicitării, eventualele documente lipsă și data estimată de emitere.`,
    "",
    `Mulțumim,`,
    company,
  ].join("\n");
}
