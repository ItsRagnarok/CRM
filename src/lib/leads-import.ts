/**
 * Importul de leaduri din fișier (Super Admin → Leads → „Importă din fișier”).
 * Formatul e JSON, ușor de scris de mână sau de generat:
 *
 * {
 *   "format": "electrofield-leads", "versiune": 1,
 *   "leaduri": [{
 *     "firma": "ASCORP", "persoana": "Sorin Călinescu", "telefon": "...", "email": "...",
 *     "etapa": "contactat", "sursa": "altul", "tehnicieni": 30, "domenii": ["electric"],
 *     "valoare_lunara": 1170, "reluare": "2026-11-27", "unelte": "...", "probleme": "...",
 *     "istoric": [{ "data": "2026-11-25T08:30", "tip": "email", "directie": "trimis", "text": "..." }]
 *   }]
 * }
 *
 * Funcție pură (fără baza de date), testată în scripts/leads-import.test.mjs.
 */
const STAGES = ["nou", "contactat", "discutie", "oferta", "negociere", "castigat", "pierdut"];
const SOURCES = ["site", "programari", "facebook", "recomandare", "telefon", "targ", "outbound", "altul"];
const DOMAINS = ["gaze", "electric", "fotovoltaic"];
const KINDS = ["nota", "apel", "whatsapp", "email", "discutie"];

export type ImportedEvent = { kind: string; body: string; created_at: string };
export type ImportedLead = {
  company_name: string; contact_name: string | null; phone: string | null; email: string | null;
  stage: string; source: string; team_size: number | null; domains: string[]; estimated_value: number | null;
  next_follow_up: string | null; current_tools: string | null; problems: string | null; lost_reason: string | null;
  events: ImportedEvent[];
};

const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/** „2026-11-25T08:30” sau „2026-11-25” (ora României) → ISO UTC. */
export function romaniaToIso(v: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/.exec(v.trim());
  if (!m) return Number.isNaN(Date.parse(v)) || !/[zZ]|[+-]\d{2}:?\d{2}$/.test(v) ? null : new Date(v).toISOString();
  const [, y, mo, d, h = "12", mi = "00"] = m;
  // Diferența României față de UTC în ziua aceea (2 iarna, 3 vara).
  const guess = Date.UTC(+y, +mo - 1, +d, +h, +mi);
  const local = new Date(new Date(guess).toLocaleString("en-US", { timeZone: "Europe/Bucharest" }));
  const offset = local.getTime() - new Date(new Date(guess).toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  return new Date(guess - offset).toISOString();
}

export function parseLeadsFile(text: string): { leads: ImportedLead[]; errors: string[] } {
  let data: unknown;
  try { data = JSON.parse(text); } catch { return { leads: [], errors: ["Fișierul nu e JSON valid."] }; }
  const root = data as { format?: unknown; leaduri?: unknown };
  if (!root || root.format !== "electrofield-leads" || !Array.isArray(root.leaduri)) {
    return { leads: [], errors: ["Fișierul nu e în formatul ElectroField (lipsește „format”: „electrofield-leads” sau lista „leaduri”)."] };
  }
  const leads: ImportedLead[] = [];
  const errors: string[] = [];
  root.leaduri.slice(0, 500).forEach((raw, i) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const company = str(r.firma, 160);
    if (!company) { errors.push(`Leadul ${i + 1}: lipsește „firma”.`); return; }
    const stage = typeof r.etapa === "string" && STAGES.includes(r.etapa) ? r.etapa : "nou";
    const team = typeof r.tehnicieni === "number" && Number.isInteger(r.tehnicieni) && r.tehnicieni > 0 && r.tehnicieni <= 10000 ? r.tehnicieni : null;
    const value = typeof r.valoare_lunara === "number" && r.valoare_lunara > 0 ? Math.round(r.valoare_lunara * 100) / 100 : null;
    const follow = typeof r.reluare === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.reluare) ? r.reluare : null;
    const events: ImportedEvent[] = [];
    (Array.isArray(r.istoric) ? r.istoric : []).slice(0, 200).forEach((e, j) => {
      const ev = (e ?? {}) as Record<string, unknown>;
      const body = str(ev.text, 4000);
      const at = typeof ev.data === "string" ? romaniaToIso(ev.data) : null;
      if (!body || !at) { errors.push(`${company}, istoric ${j + 1}: lipsește „text” sau „data” (AAAA-LL-ZZ sau AAAA-LL-ZZTHH:MM).`); return; }
      const kind = typeof ev.tip === "string" && KINDS.includes(ev.tip) ? ev.tip : "nota";
      const dir = ev.directie === "primit" ? "Primit" : ev.directie === "trimis" ? "Trimis" : null;
      const full = dir ? `${dir}: ${body}` : body;
      events.push({ kind, body: full.length > 2000 ? `${full.slice(0, 1990)} […]` : full, created_at: at });
    });
    leads.push({
      company_name: company,
      contact_name: str(r.persoana, 120), phone: str(r.telefon, 40), email: str(r.email, 160),
      stage, source: typeof r.sursa === "string" && SOURCES.includes(r.sursa) ? r.sursa : "altul",
      team_size: team, domains: Array.isArray(r.domenii) ? DOMAINS.filter((d) => (r.domenii as unknown[]).includes(d)) : [],
      estimated_value: value, next_follow_up: follow,
      current_tools: str(r.unelte, 1000), problems: str(r.probleme, 2000),
      lost_reason: stage === "pierdut" ? str(r.motiv_pierdut, 300) : null,
      events,
    });
  });
  return { leads, errors };
}

/** Cheia de potrivire cu un lead existent: numele firmei, fără diacritice, majuscule sau semne. */
export const companyKey = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
