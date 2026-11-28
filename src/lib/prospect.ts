/**
 * Prospectare: găsirea firmelor care ar putea folosi ElectroField (Super Admin → Prospectare).
 * Funcții pure, fără rețea și fără baza de date: citirea răspunsurilor ANAF, extragerea
 * adreselor și a CUI-ului din paginile unui site, filtrele dure ale unei campanii.
 * Testate în scripts/prospect.test.mjs. Rețeaua e în scripts/prospect/tool.mts.
 */

export const PROSPECT_STATUSES = [
  { id: "candidat", label: "De verificat" },
  { id: "aprobat", label: "Aprobat" },
  { id: "respins", label: "Respins" },
  { id: "importat", label: "Mutat în Leads" },
] as const;

export const CAMPAIGN_DOMAINS = [
  { id: "gaze", label: "Gaze" },
  { id: "electric", label: "Electric" },
  { id: "fotovoltaic", label: "Fotovoltaic" },
  { id: "altul", label: "Altele (HVAC, mentenanță, telecom)" },
] as const;

/** Coduri CAEN potrivite din oficiu, pe domeniu. Campania le poate schimba. */
export const DEFAULT_CAEN: Record<string, string[]> = {
  gaze: ["4322", "4221", "4329", "7112", "7120", "3530"],
  electric: ["4321", "4222", "4329", "7112", "3320", "3314"],
  fotovoltaic: ["4321", "3511", "4322", "7112", "4329"],
  altul: ["4322", "4321", "4329", "3320", "8110", "6110", "6120"],
};

export const SIZE_BUCKETS = [
  { id: "1-9", min: 1, max: 9 },
  { id: "10-49", min: 10, max: 49 },
  { id: "50-199", min: 50, max: 199 },
  { id: "200+", min: 200, max: Infinity },
] as const;

export function sizeBucket(employees: number | null | undefined): string {
  if (employees == null || !Number.isFinite(employees) || employees < 1) return "necunoscut";
  return SIZE_BUCKETS.find((b) => employees >= b.min && employees <= b.max)?.id ?? "necunoscut";
}

// ---------- ANAF ----------

export type AnafCompany = {
  cui: string; name: string; address: string | null; county: string | null; city: string | null;
  phone: string | null; caen: string | null; regDate: string | null; active: boolean; statusText: string;
};

const nz = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Un element din `found` al serviciului ANAF PlatitorTvaRest v9. */
export function parseAnafTva(item: unknown): AnafCompany | null {
  const it = (item ?? {}) as Record<string, Record<string, unknown>>;
  const g = it.date_generale ?? {};
  const cui = g.cui != null ? String(g.cui) : null;
  const name = nz(g.denumire);
  if (!cui || !name) return null;
  const sed = it.adresa_sediu_social ?? {};
  const inactive = it.stare_inactiv ?? {};
  const status = nz(g.stare_inregistrare) ?? "";
  const radiat = Boolean(nz(inactive.dataRadiere)) || /RADIERE|RADIAT/i.test(status);
  const bad = radiat || inactive.statusInactivi === true || /INSOLV|FALIMENT|DIZOLV|LICHID|SUSPEND/i.test(status);
  return {
    cui, name,
    address: nz(g.adresa),
    county: titleCase(nz(sed.sdenumire_Judet)),
    city: cleanCity(titleCase(nz(sed.sdenumire_Localitate))),
    phone: nz(g.telefon),
    caen: nz(g.cod_CAEN),
    regDate: nz(g.data_inregistrare),
    active: !bad,
    statusText: status,
  };
}

export type AnafFinancials = { year: number; employees: number | null; turnover: number | null; profit: number | null; caen: string | null };

/** Răspunsul serviciului ANAF „bilant” (indicatori I13 cifra de afaceri, I18/I19 profit/pierdere, I20 salariați). */
export function parseAnafBilant(json: unknown): AnafFinancials | null {
  const j = (json ?? {}) as { an?: number; caen?: number | string; i?: { indicator: string; val_indicator: number }[] };
  if (!j.an || !Array.isArray(j.i) || j.i.length === 0) return null;
  const v = (k: string) => {
    const x = j.i!.find((i) => i.indicator === k)?.val_indicator;
    return typeof x === "number" && Number.isFinite(x) ? x : null;
  };
  const profit = v("I18"), loss = v("I19");
  return {
    year: j.an,
    employees: v("I20"),
    turnover: v("I13"),
    profit: profit == null && loss == null ? null : profit ? profit : loss ? -loss : 0,
    caen: j.caen != null && String(j.caen) !== "0" ? String(j.caen).padStart(4, "0") : null,
  };
}

/** „Mun. Brașov” → „Brașov”, „Sector 5 Mun. București” → „București, Sector 5”. */
function cleanCity(s: string | null): string | null {
  if (!s) return null;
  const sector = s.match(/^Sector (\d) Mun\. Bucure[șş]ti$/i);
  if (sector) return `București, Sector ${sector[1]}`;
  return s.replace(/^(Mun\.|Municipiul|Orș\.|Oraș|Orașul)\s+/i, "").trim();
}

function titleCase(s: string | null): string | null {
  if (!s) return null;
  return s.replace(/ş/g, "ș").replace(/Ş/g, "Ș").replace(/ţ/g, "ț").replace(/Ţ/g, "Ț").toLocaleLowerCase("ro-RO").replace(/(^|[\s-])(\p{L})/gu, (_m, a, b) => a + b.toLocaleUpperCase("ro-RO"))
    .replace(/^Municipiul Bucureşti$|^Municipiul București$/i, "București");
}

// ---------- CUI ----------

/** Cifra de control a codului fiscal românesc (cheia 753217532). */
export function isValidCui(raw: string): boolean {
  const d = raw.replace(/^RO/i, "").trim();
  if (!/^\d{2,10}$/.test(d)) return false;
  const key = "753217532";
  const body = d.slice(0, -1).padStart(9, "0");
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(body[i]) * Number(key[i]);
  const c = ((sum * 10) % 11) % 10;
  return c === Number(d.at(-1));
}

/** CUI-urile valide scrise lângă „CUI”, „CIF”, „Cod fiscal”, „Cod unic de înregistrare”. */
export function extractCuis(text: string): string[] {
  const out = new Set<string>();
  const re = /(?:C\.?\s?U\.?\s?I\.?|C\.?\s?I\.?\s?F\.?|cod\s+(?:unic\s+de\s+[îi]nregistrare|fiscal|de\s+identificare\s+fiscal[ăa])|VAT(?:\s+(?:no|number))?\.?)\s*[:.\-]?\s*(?:RO\s?)?(\d{2,10})\b/giu;
  for (const m of text.matchAll(re)) if (isValidCui(m[1])) out.add(m[1]);
  // „RO12345678” singur, des întâlnit în subsol
  for (const m of text.matchAll(/\bRO\s?(\d{6,10})\b/g)) if (isValidCui(m[1])) out.add(m[1]);
  return [...out];
}

// ---------- E-mail și telefon ----------

const JUNK_EMAIL = /\.(png|jpe?g|gif|webp|svg|css|js)$|@(example|domain|sentry|wixpress|sentry-next|dataprotection|anpc|anaf|anre|ancom|anspdcp)\.|^(no-?reply|noreply|mailer-daemon|postmaster|abuse|webmaster|wordpress|admin@wordpress)@|@[\w.-]*\.(local|test|invalid)$|u00[0-9a-f]{2}/i;
const GENERIC_WORD = "office|contact|info|oferte?|ofertare|vanzari|sales|comercial|secretariat|receptie|suport|support|service|hello|hr|cariere|jobs|achizitii|tehnic|dispecerat|programari|comenzi|financiar|contabilitate|facturare|marketing|admin|firma|mail|email|general|management|depozit|gdpr|dpo|privacy|magazin|showroom|proiectare|executie";
/** Adresă de firmă, nu de om: „office@”, „instal.office@”, „depozit.cluj@”, „info2@”. */
const GENERIC_LOCAL = new RegExp(`^(?:[a-z]+[._-])?(?:${GENERIC_WORD})(?:[._-][a-z]+)?\\d*$`, "i");

/** Decodează adresele ascunse de Cloudflare („data-cfemail”). */
export function decodeCfEmail(hex: string): string | null {
  if (!/^[0-9a-f]{4,}$/i.test(hex) || hex.length % 2) return null;
  const key = parseInt(hex.slice(0, 2), 16);
  let s = "";
  for (let i = 2; i < hex.length; i += 2) s += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
  return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(s) ? s : null;
}

export function extractEmails(html: string): string[] {
  const out = new Set<string>();
  const add = (e: string) => {
    const x = e.trim().replace(/^mailto:/i, "").split("?")[0].replace(/[.,;:)]+$/, "").toLowerCase();
    if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(x) && !JUNK_EMAIL.test(x)) out.add(x);
  };
  for (const m of html.matchAll(/data-cfemail="([0-9a-f]+)"/gi)) { const e = decodeCfEmail(m[1]); if (e) add(e); }
  for (const m of html.matchAll(/\/cdn-cgi\/l\/email-protection#([0-9a-f]+)/gi)) { const e = decodeCfEmail(m[1]); if (e) add(e); }
  const text = html.replace(/&#64;|&commat;/gi, "@").replace(/&#46;/g, ".")
    .replace(/\s*[[(]\s*(?:at|a)\s*[\])]\s*/gi, "@").replace(/\s*[[(]\s*(?:dot|punct)\s*[\])]\s*/gi, ".");
  for (const m of text.matchAll(/mailto:([^"'\s>]+)/gi)) add(decodeURIComponent(m[1]));
  for (const m of text.matchAll(/[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/gi)) add(m[0]);
  return [...out];
}

export const emailKind = (email: string): "generic" | "personal" => (GENERIC_LOCAL.test(email.split("@")[0]) ? "generic" : "personal");
export const emailDomain = (email: string) => email.split("@")[1]?.toLowerCase() ?? "";

/** Telefoane românești (fix și mobil), aduse la forma 07xx xxx xxx / 02xx xxx xxx. */
export function extractPhones(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/(?:\+|\b00)?\(?\d[\d\s.\-/()]{7,16}\d\b/g)) {
    let d = m[0].replace(/\D/g, "");
    if (d.startsWith("0040")) d = d.slice(4); else if (d.startsWith("40") && d.length === 11) d = d.slice(2);
    if (!d.startsWith("0")) d = `0${d}`;
    if (d.length === 10 && /^0[237]/.test(d)) out.add(/^0[23]1/.test(d) ? d.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1 $2 $3") : d.replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3"));
  }
  return [...out].slice(0, 6);
}

// ---------- Site ----------

/** Textul vizibil al unei pagini HTML, fără scripturi și stiluri. */
export function htmlToText(html: string): string {
  return html.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr|section)>/gi, "\n").replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_m, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
}

const USEFUL_PATH = /contact|despre|about|echip|team|firma|compan|cine-suntem|servic|autoriz|certific|portofoliu|lucrari|proiecte|cariere|impressum|termeni|confiden|gdpr|date-personale|legal/i;
/** Ordinea paginilor: contact (adresa, CUI), despre/echipă (oameni), autorizări/servicii, apoi paginile legale (CUI). */
const linkRank = (u: string) => (/contact/i.test(u) ? 0 : /despre|about|echip|team|cine-suntem|firma|compan/i.test(u) ? 1 : /termeni|confiden|gdpr|date-personale|legal|impressum/i.test(u) ? 3 : 2);

/** Linkurile interne utile (contact, despre, echipă, servicii, autorizări), cel mult `max`. */
export function usefulLinks(html: string, baseUrl: string, max = 6): string[] {
  const base = new URL(baseUrl);
  const host = base.hostname.replace(/^www\./, "");
  const out: string[] = [];
  for (const m of html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let u: URL;
    try { u = new URL(m[1], base); } catch { continue; }
    if (!/^https?:$/.test(u.protocol) || u.hostname.replace(/^www\./, "") !== host) continue;
    if (/\.(pdf|jpe?g|png|zip|docx?|xlsx?)$/i.test(u.pathname)) continue;
    const label = htmlToText(m[2]);
    if (!USEFUL_PATH.test(u.pathname) && !USEFUL_PATH.test(label)) continue;
    u.hash = ""; u.search = "";
    const s = u.toString();
    if (s !== base.toString() && !out.includes(s)) out.push(s);
    if (out.length >= 40) break;
  }
  return out.sort((a, b) => linkRank(a) - linkRank(b)).slice(0, max);
}

const LEGAL_SUFFIX = /\b(s\.?\s?c\.?|s\.?\s?r\.?\s?l\.?(?:-?d)?|s\.?\s?a\.?|s\.?\s?n\.?\s?c\.?|i\.?\s?i\.?|p\.?\s?f\.?\s?a\.?|impex|com(?:pany)?|group|grup|romania|international|trading)\b/gi;

/** Domeniile probabile ale unei firme după nume: „VIMED SRL” → vimed.ro, vimed.com … */
export function domainGuesses(name: string): string[] {
  const clean = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/&/g, " si ").replace(LEGAL_SUFFIX, " ").replace(/[^a-z0-9 -]+/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const words = clean.split(" ").filter(Boolean);
  const stems = new Set([words.join(""), words.join("-")]);
  if (words.length > 1 && words[0].length >= 4) stems.add(words[0]);
  if (words.length > 2) stems.add(words.slice(0, 2).join(""));
  const out: string[] = [];
  for (const s of stems) if (s.length >= 3) for (const tld of [".ro", ".com", ".eu"]) out.push(`${s}${tld}`);
  return out.slice(0, 12);
}

const DIRECTORY = /(termene|listafirme|lista-firme|risco|firme\.info|totalfirme|romanian-companies|facebook|instagram|linkedin|olx|publi24|google|youtube|tiktok|wikipedia|anre|anaf|onrc|paginiaurii|cylex|infobusiness|firmepenet|edirectory|kompass|mfinante|startupcafe|bizoo|cauta-firme)\./i;
export const isDirectoryHost = (host: string) => DIRECTORY.test(host);

// ---------- Campanie ----------

export type CampaignRules = {
  caen_codes: string[] | null; min_employees: number | null; max_employees: number | null;
  counties: string[] | null; min_turnover: number | null;
};

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/^judetul\s+|^municipiul\s+/, "").trim();

/** Motivele pentru care o firmă nu trece filtrele dure ale campaniei (gol = trece). */
export function hardFilterReasons(c: {
  active: boolean; caen: string | null; employees: number | null; county: string | null; turnover: number | null;
}, rules: CampaignRules): string[] {
  const r: string[] = [];
  if (!c.active) r.push("firmă inactivă, radiată sau în insolvență");
  if (rules.caen_codes?.length && c.caen && !rules.caen_codes.includes(c.caen.slice(0, 4))) r.push(`activitate principală CAEN ${c.caen}, nu e în lista campaniei`);
  if (rules.min_employees != null && c.employees != null && c.employees < rules.min_employees) r.push(`${c.employees} angajați, sub minimul de ${rules.min_employees}`);
  if (rules.max_employees != null && c.employees != null && c.employees > rules.max_employees) r.push(`${c.employees} angajați, peste maximul de ${rules.max_employees}`);
  if (rules.min_turnover != null && c.turnover != null && c.turnover < rules.min_turnover) r.push("cifră de afaceri sub pragul campaniei");
  if (rules.counties?.length && c.county && !rules.counties.map(fold).includes(fold(c.county))) r.push(`județul ${c.county} nu e în campanie`);
  return r;
}

/** Cheia de potrivire cu firmele deja găsite sau deja în Leads. */
export const hostKey = (urlOrHost: string) => {
  try { return new URL(/^https?:/.test(urlOrHost) ? urlOrHost : `https://${urlOrHost}`).hostname.replace(/^www\./, "").toLowerCase(); }
  catch { return urlOrHost.toLowerCase(); }
};

// ---------- Export ----------

const csvCell = (v: unknown) => {
  const s = v == null ? "" : Array.isArray(v) ? v.join("; ") : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export function toCsv(rows: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
  return "﻿" + [columns.map((c) => csvCell(c.label)).join(","), ...rows.map((r) => columns.map((c) => csvCell(r[c.key])).join(","))].join("\n");
}

/** CUI-urile din linkurile sau titlurile unor rezultate de căutare (termene.ro/firma/123, listafirme.ro/x-123/, „123 FIRMA SRL”). */
export function cuisFromSearchText(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/(?:termene\.ro\/firma\/|risco\.ro\/[^\s"']*?-|listafirme\.ro\/[^\s"']*?-|lista-firme\.info\/[^\s"']*?|totalfirme\.ro\/[^\s"']*?|\/cui\/?|"title":\s*")(\d{2,10})\b/gi)) if (isValidCui(m[1])) out.add(m[1]);
  return [...out];
}

const coreWords = (name: string) => name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(LEGAL_SUFFIX, " ")
  .replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length >= 3);

/**
 * Cât de sigur e că un site e al firmei din ANAF. „sigur”: CUI-ul apare pe site, sau numele plus telefonul ori localitatea.
 * „probabil”: doar numele. „nu”: altceva.
 */
export function siteMatch(site: { cuis: string[]; text: string; phones: string[]; title: string | null }, firm: { cui: string; name: string; phone: string | null; city: string | null }): "sigur" | "probabil" | "nu" {
  if (site.cuis.includes(firm.cui)) return "sigur";
  const hay = `${site.title ?? ""} ${site.text}`.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const words = coreWords(firm.name);
  const nameHit = words.length > 0 && words.every((w) => hay.includes(w));
  if (!nameHit) return "nu";
  const digits = (s: string) => s.replace(/\D/g, "").slice(-9);
  const phoneHit = firm.phone ? site.phones.some((p) => digits(p) === digits(firm.phone!)) : false;
  const city = firm.city?.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/^(mun\.|municipiul|oras|orasul|sat|com\.)\s*/g, "").split(/\s+(com\.|sat)/)[0].trim();
  const cityHit = city ? hay.includes(city) : false;
  return site.cuis.length && !site.cuis.includes(firm.cui) ? "nu" : phoneHit || cityHit ? "sigur" : "probabil";
}
