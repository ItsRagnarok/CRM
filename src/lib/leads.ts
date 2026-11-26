/**
 * Leads: etape, surse și calcule pentru lista de oportunități. Funcții pure (fără importuri),
 * testate în scripts/leads.test.mjs.
 */

export const LEAD_STAGES = [
  { id: "nou", label: "Noi" },
  { id: "contactat", label: "Contactați" },
  { id: "oferta", label: "Ofertă trimisă" },
  { id: "negociere", label: "Negociere" },
  { id: "castigat", label: "Câștigați" },
  { id: "pierdut", label: "Pierduți" },
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number]["id"];

export const OPEN_STAGES: readonly LeadStage[] = ["nou", "contactat", "oferta", "negociere"];

export const LEAD_SOURCES = [
  { id: "telefon", label: "Telefon" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "E-mail" },
  { id: "site", label: "Site" },
  { id: "recomandare", label: "Recomandare" },
  { id: "facebook", label: "Facebook" },
  { id: "teren", label: "De pe teren" },
  { id: "altul", label: "Altă sursă" },
] as const;

export const isLeadStage = (s: string): s is LeadStage => LEAD_STAGES.some((x) => x.id === s);
export const isOpenStage = (s: string) => (OPEN_STAGES as readonly string[]).includes(s);
export const leadSourceLabel = (id: string) => LEAD_SOURCES.find((s) => s.id === id)?.label ?? id;
export const leadStageLabel = (id: string) => LEAD_STAGES.find((s) => s.id === id)?.label ?? id;

/** Următoarea etapă din drum (pentru butonul „Mută mai departe”); null la capăt. */
export function nextStage(stage: string): LeadStage | null {
  const i = OPEN_STAGES.indexOf(stage as LeadStage);
  return i >= 0 && i < OPEN_STAGES.length - 1 ? OPEN_STAGES[i + 1] : null;
}

export type FollowUp = "intarziat" | "azi" | "viitor" | "fara";

/** Reluarea unui lead deschis: întârziată, azi, mai târziu sau nesetată. `today` = „AAAA-LL-ZZ”. */
export function followUpState(date: string | null, today: string, stage: string): FollowUp {
  if (!date || !isOpenStage(stage)) return "fara";
  if (date < today) return "intarziat";
  return date === today ? "azi" : "viitor";
}

/** „2026-11-27” → „27.11.2026”. */
export const shortDate = (iso: string) => iso.split("-").reverse().join(".");

/** Valoarea totală a leadurilor deschise și câte au valoare setată. */
export function pipelineValue(leads: { stage: string; estimated_value: number | string | null }[]) {
  let total = 0;
  let counted = 0;
  for (const l of leads) {
    if (!isOpenStage(l.stage) || l.estimated_value == null) continue;
    const v = Number(l.estimated_value);
    if (!Number.isFinite(v)) continue;
    total += v;
    counted++;
  }
  return { total, counted };
}

/** Rata de câștig din leadurile închise (0–100), null dacă nu există niciunul închis. */
export function winRate(leads: { stage: string }[]): number | null {
  const won = leads.filter((l) => l.stage === "castigat").length;
  const lost = leads.filter((l) => l.stage === "pierdut").length;
  return won + lost === 0 ? null : Math.round((won / (won + lost)) * 100);
}

export const formatLei = (n: number) => `${new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(n)} lei`;
