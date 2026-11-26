/**
 * Leads din panoul de super admin: etape, surse, calcule și briefului pentru Claude.
 * Funcții pure, testate în scripts/leads.test.mjs.
 */
import { capabilitiesText } from "./platform-capabilities";

export const LEAD_STAGES = [
  { id: "nou", label: "De contactat" },
  { id: "contactat", label: "Contactat" },
  { id: "discutie", label: "Discuție" },
  { id: "oferta", label: "Ofertă trimisă" },
  { id: "negociere", label: "Negociere" },
  { id: "castigat", label: "Câștigat" },
  { id: "pierdut", label: "Pierdut" },
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number]["id"];
export const OPEN_STAGES: readonly LeadStage[] = ["nou", "contactat", "discutie", "oferta", "negociere"];

export const LEAD_SOURCES = [
  { id: "site", label: "Site" },
  { id: "programari", label: "Programări" },
  { id: "facebook", label: "Facebook" },
  { id: "recomandare", label: "Recomandare" },
  { id: "telefon", label: "Telefon" },
  { id: "targ", label: "Târg" },
  { id: "outbound", label: "E-mail rece" },
  { id: "altul", label: "Altă sursă" },
] as const;

export const EVENT_KINDS = [
  { id: "nota", label: "Notă" },
  { id: "apel", label: "Apel" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "E-mail" },
  { id: "discutie", label: "Discuție" },
] as const;

export const LEAD_DOMAINS = [
  { id: "gaze", label: "Gaze" },
  { id: "electric", label: "Electric" },
  { id: "fotovoltaic", label: "Fotovoltaic" },
] as const;

/** Ce a cerut firma în răspunsul ei: se vede pe card, ca să știi din prima ce urmează. */
export const LEAD_WANTS = [
  { id: "demo", label: "Vrea demo" },
  { id: "prezentare", label: "Vrea prezentare" },
  { id: "apel", label: "Vrea apel" },
  { id: "costuri", label: "Întreabă de costuri" },
  { id: "detalii", label: "Vrea detalii" },
  { id: "mai_tarziu", label: "Mai târziu" },
  { id: "raspuns_automat", label: "Răspuns automat" },
] as const;
/** Etichetele gata de bifat; poți adăuga și altele proprii. */
export const IMPORTANT_TAG = "Important";
export const PRESET_TAGS = [IMPORTANT_TAG, "Urgent", "Cald", "Rece", "De urmărit"] as const;
export const MAX_TAGS = 8;
export const MAX_TAG_LENGTH = 24;

/** Curăță etichetele: spații, lungime, dubluri (fără diferență de litere mari), cel mult 8. */
export function normalizeTags(tags: readonly unknown[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of tags) {
    if (typeof raw !== "string") continue;
    const tag = raw.replace(/\s+/g, " ").trim().slice(0, MAX_TAG_LENGTH).trim();
    const key = tag.toLocaleLowerCase("ro-RO");
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length === MAX_TAGS) break;
  }
  return out;
}

export const hasTag = (tags: readonly string[] | null | undefined, tag: string) =>
  (tags ?? []).some((t) => t.toLocaleLowerCase("ro-RO") === tag.toLocaleLowerCase("ro-RO"));

/** Bifează sau debifează o etichetă (aceeași etichetă scrisă altfel contează ca una). */
export function toggleTag(tags: readonly string[] | null | undefined, tag: string): string[] {
  const list = tags ?? [];
  return hasTag(list, tag) ? list.filter((t) => t.toLocaleLowerCase("ro-RO") !== tag.toLocaleLowerCase("ro-RO")) : normalizeTags([...list, tag]);
}

export const wantLabel = (id: string) => LEAD_WANTS.find((w) => w.id === id)?.label ?? id;

export const isLeadStage = (s: string): s is LeadStage => LEAD_STAGES.some((x) => x.id === s);
export const isOpenStage = (s: string) => (OPEN_STAGES as readonly string[]).includes(s);
export const stageLabel = (id: string) => LEAD_STAGES.find((s) => s.id === id)?.label ?? id;
export const sourceLabel = (id: string) => LEAD_SOURCES.find((s) => s.id === id)?.label ?? id;
export const kindLabel = (id: string) => (id === "etapa" ? "Etapă" : EVENT_KINDS.find((k) => k.id === id)?.label ?? id);
export const domainLabel = (id: string) => LEAD_DOMAINS.find((d) => d.id === id)?.label ?? id;

/** Următoarea etapă din drum; după negociere nu mai e una (se alege Câștigat sau Pierdut). */
export function nextStage(stage: string): LeadStage | null {
  const i = OPEN_STAGES.indexOf(stage as LeadStage);
  return i >= 0 && i < OPEN_STAGES.length - 1 ? OPEN_STAGES[i + 1] : null;
}

export type FollowUp = "intarziat" | "azi" | "viitor" | "fara";
/** Reluarea unui lead deschis. `today` = „AAAA-LL-ZZ”. */
export function followUpState(date: string | null, today: string, stage: string): FollowUp {
  if (!date || !isOpenStage(stage)) return "fara";
  if (date < today) return "intarziat";
  return date === today ? "azi" : "viitor";
}

/** „2026-11-27” → „27.11”. */
export const dayMonth = (iso: string) => iso.split("-").reverse().slice(0, 2).join(".");

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

/** Rata de câștig din leadurile închise (0–100); null dacă nu există niciunul închis. */
export function winRate(leads: { stage: string }[]): number | null {
  const won = leads.filter((l) => l.stage === "castigat").length;
  const lost = leads.filter((l) => l.stage === "pierdut").length;
  return won + lost === 0 ? null : Math.round((won / (won + lost)) * 100);
}

export const formatLei = (n: number) => `${new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(n)} lei`;

export type BriefLead = {
  company_name: string; contact_name: string | null; phone: string | null; email: string | null;
  stage: string; source: string; team_size: number | null; domains: string[]; estimated_value: number | string | null;
  next_follow_up: string | null; current_tools: string | null; problems: string | null; lost_reason: string | null; created_at: string;
  wants?: string[] | null; last_reply?: string | null; tags?: string[] | null;
};
export type BriefEvent = { kind: string; body: string; created_at: string };

const stamp = (iso: string) => new Date(iso).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/**
 * Textul care se lipește într-un chat cu Claude: lead, istoric și ce poate platforma,
 * plus ce vrei de la răspuns. Platforma nu cheamă niciun AI; copiezi și lipești.
 */
export function buildBrief(lead: BriefLead, events: BriefEvent[], today: string): string {
  const line = (k: string, v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? `${k}: necunoscut` : `${k}: ${v}`);
  const history = [...events].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((e) => `- ${stamp(e.created_at)} · ${kindLabel(e.kind)}: ${e.body}`);
  return [
    "Ești consilierul meu de vânzări pentru Electrofield, o platformă pentru firme de instalații (gaze, electric, fotovoltaic).",
    "Platforma nu a fost încă testată cu o firmă reală. Nu vreau să o prezint. Vreau să aflu ce probleme au ei concret și să văd dacă le pot rezolva.",
    "Vorbește-mi pe „tu”, scurt și concret. Nu inventa ce nu scrie aici: spune că nu știi.",
    "",
    `Azi: ${today}`,
    "",
    "LEAD",
    line("Firmă", lead.company_name),
    line("Persoană", lead.contact_name),
    line("Telefon", lead.phone),
    line("E-mail", lead.email),
    `Etapă: ${stageLabel(lead.stage)}`,
    `Sursă: ${sourceLabel(lead.source)}`,
    line("Tehnicieni", lead.team_size),
    line("Domenii", lead.domains.length ? lead.domains.map(domainLabel).join(", ") : null),
    line("Valoare estimată pe lună", lead.estimated_value == null ? null : formatLei(Number(lead.estimated_value))),
    line("Ce folosesc acum", lead.current_tools),
    line("Etichete", (lead.tags ?? []).length ? (lead.tags ?? []).join(", ") : null),
    line("Ce au cerut", (lead.wants ?? []).length ? (lead.wants ?? []).map(wantLabel).join(", ") : null),
    line("Ultimul lor răspuns", lead.last_reply),
    line("Nevoi și context", lead.problems),
    line("De reluat la", lead.next_follow_up),
    ...(lead.lost_reason ? [`Motiv pierdut: ${lead.lost_reason}`] : []),
    `Intrat în lista mea: ${stamp(lead.created_at)}`,
    "",
    "ISTORIC (cele mai noi primele)",
    ...(history.length ? history : ["- nimic notat încă"]),
    "",
    "CE POATE PLATFORMA ACUM",
    capabilitiesText(),
    "",
    "RĂSPUNDE CU",
    "1. Ce am înțeles despre ei.",
    "2. Ce nu știu încă și ar trebui să aflu.",
    "3. Ce fac acum, cu ziua și ora.",
    "4. 4-5 întrebări de pus la o discuție de descoperire, fără să prezint platforma.",
    "5. Mesajul gata de trimis, pe „tu”, pe canalul potrivit.",
    "6. Ce să NU promit, ținând cont de ce nu e gata sau netestat.",
  ].join("\n");
}
