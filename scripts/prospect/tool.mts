/**
 * Unelte de rețea pentru agentul de prospectare (vezi scripts/prospect/AGENT.md).
 * Rulează cu: NODE_USE_ENV_PROXY=1 npx jiti scripts/prospect/tool.mts <comandă> ...
 *
 *   anaf <cui...>               date ANAF: stare, CAEN, județ, angajați, cifră de afaceri (gratuit, ~1 cerere/s)
 *   site <domeniu|url> [cui]    citește site-ul: e-mailuri, telefoane, CUI, servicii; verifică MX
 *   find-site "<nume>" <cui> [tel] [loc]  ghicește site-ul după nume; îl acceptă doar dacă e al firmei (câmpul match)
 *   enrich <cui...>             anaf + find-site + site, câte un JSON pe firmă
 *   cuis                        CUI-urile valide din textul de pe stdin (rezultate de căutare, linkuri termene.ro)
 *   screen <campanie.json> <cui...>  ANAF + filtrele dure ale campaniei; scoate doar firmele noi care trec
 *   save-sql <runId>            din JSON-ul de pe stdin ({campaign_id, companies:[...]}) scrie SQL-ul de salvare (îl rulează agentul)
 *   finish-sql <runId>          din JSON-ul de pe stdin ({summary, stats, queries}) scrie SQL-ul care închide rularea
 *   sql                         rulează SQL-ul de pe stdin prin api.supabase.com (doar unde tokenul de acolo e valid)
 *
 * Baza se citește și se scrie prin conectorul Supabase al agentului (execute_sql); comenzile de aici doar pregătesc SQL-ul.
 * Scrie JSON (sau SQL) pe stdout. Nu trimite e-mailuri.
 */
import {
  cuisFromSearchText, siteMatch, hardFilterReasons, isValidCui,
  parseAnafTva, parseAnafBilant, extractCuis, extractEmails, extractPhones, usefulLinks, htmlToText,
  domainGuesses, emailKind, emailDomain, hostKey, isDirectoryHost, type AnafCompany, type AnafFinancials,
} from "../../src/lib/prospect";

const PROJECT = process.env.SUPABASE_PROJECT_REF ?? "hrzpowmmbuqihtbkisyu";
const UA = "Mozilla/5.0 (compatible; ElectroFieldProspect/1.0; +https://www.electrofield.ro)";
const CHALLENGE = /Un moment, v[ăa] rog|Just a moment|Enable JavaScript and cookies|cf-browser-verification|Checking your browser/i;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(url: string, ms = 12000): Promise<{ url: string; status: number; html: string } | null> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "ro-RO,ro;q=0.9" }, redirect: "follow", signal: AbortSignal.timeout(ms) });
    const type = r.headers.get("content-type") ?? "";
    if (!/html|text/i.test(type)) return { url: r.url, status: r.status, html: "" };
    const html = (await r.text()).slice(0, 800_000);
    return { url: r.url, status: r.status, html };
  } catch { return null; }
}

// ---------- ANAF ----------

export async function anaf(cuis: string[]): Promise<Record<string, { general: AnafCompany | null; financials: AnafFinancials | null }>> {
  const today = new Date().toISOString().slice(0, 10);
  const out: Record<string, { general: AnafCompany | null; financials: AnafFinancials | null }> = {};
  const list = [...new Set(cuis.map((c) => c.replace(/^RO/i, "").trim()).filter((c) => /^\d{2,10}$/.test(c)))];
  for (let i = 0; i < list.length; i += 100) {
    const batch = list.slice(i, i + 100);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await fetch("https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batch.map((cui) => ({ cui: Number(cui), data: today }))), signal: AbortSignal.timeout(30000),
        });
        const j = (await r.json()) as { found?: unknown[] };
        for (const f of j.found ?? []) { const g = parseAnafTva(f); if (g) out[g.cui] = { general: g, financials: null }; }
        break;
      } catch { await sleep(2000 * (attempt + 1)); }
    }
    await sleep(1200);
  }
  // Bilanțul: anul trecut dacă e depus, altfel cu un an înainte.
  const thisYear = new Date().getFullYear();
  for (const cui of list) {
    if (!out[cui]) out[cui] = { general: null, financials: null };
    for (const year of [thisYear - 1, thisYear - 2]) {
      try {
        const r = await fetch(`https://webservicesp.anaf.ro/bilant?an=${year}&cui=${cui}`, { signal: AbortSignal.timeout(20000) });
        const f = parseAnafBilant(await r.json());
        await sleep(1100);
        if (f) { out[cui].financials = f; break; }
      } catch { await sleep(1500); }
    }
  }
  return out;
}

// ---------- DNS (prin DNS-over-HTTPS, merge și unde DNS-ul direct e închis) ----------

async function hasMx(domain: string): Promise<boolean | null> {
  try {
    const r = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`, { signal: AbortSignal.timeout(8000) });
    const j = (await r.json()) as { Status: number; Answer?: { type: number }[] };
    return j.Status === 0 && (j.Answer ?? []).some((a) => a.type === 15);
  } catch { return null; }
}

// ---------- Site ----------

export type SiteResult = {
  input: string; url: string | null; reachable: boolean; title: string | null;
  cuis: string[]; cuiMatch: boolean | null; match?: "sigur" | "probabil" | "nu";
  emails: { email: string; kind: "generic" | "personal"; onDomain: boolean; page: string }[];
  phones: string[]; mx: boolean | null; pages: string[]; text: string;
};

export async function site(input: string, cui?: string, maxPages = 8): Promise<SiteResult> {
  const host = hostKey(input);
  const res: SiteResult = { input, url: null, reachable: false, title: null, cuis: [], cuiMatch: null, emails: [], phones: [], mx: null, pages: [], text: "" };
  if (isDirectoryHost(host)) return res;
  let home: Awaited<ReturnType<typeof get>> = null;
  for (const u of [/^https?:/.test(input) ? input : `https://${host}/`, `https://www.${host}/`, `http://${host}/`]) {
    home = await get(u);
    // Pagina de așteptare anti-roboți („Un moment, vă rog…”) trece adesea la a doua încercare.
    if (home && CHALLENGE.test(home.html.slice(0, 3000))) { await sleep(3000); home = await get(u); }
    if (home && home.status < 400 && home.html.length > 200 && !CHALLENGE.test(home.html.slice(0, 3000))) break;
    home = null;
  }
  if (!home) return res;
  res.url = home.url; res.reachable = true;
  res.title = htmlToText(home.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").slice(0, 160) || null;
  const pages = [{ url: home.url, html: home.html }];
  for (const link of usefulLinks(home.html, home.url, maxPages - 1)) {
    const p = await get(link, 10000);
    if (p && p.status < 400 && p.html) pages.push({ url: p.url, html: p.html });
  }
  const finalHost = hostKey(home.url);
  const seen = new Set<string>();
  const texts: string[] = [];
  for (const p of pages) {
    if (res.pages.includes(p.url)) continue;
    res.pages.push(p.url);
    const text = htmlToText(p.html);
    texts.push(`### ${p.url}\n${text.slice(0, 2500)}`);
    for (const c of extractCuis(text)) if (!res.cuis.includes(c)) res.cuis.push(c);
    for (const e of extractEmails(p.html)) {
      if (seen.has(e)) continue;
      seen.add(e);
      const d = emailDomain(e);
      res.emails.push({ email: e, kind: emailKind(e), onDomain: d === finalHost || d === host, page: p.url });
    }
    for (const ph of extractPhones(text)) if (!res.phones.includes(ph)) res.phones.push(ph);
  }
  res.phones = res.phones.slice(0, 6);
  res.cuiMatch = cui ? res.cuis.includes(cui.replace(/^RO/i, "")) : null;
  res.mx = await hasMx(finalHost);
  res.text = texts.join("\n\n").slice(0, 9000);
  return res;
}

/**
 * Ghicește site-ul după nume (vimed.ro, termo-gaz.ro …) și îl acceptă doar dacă e al firmei:
 * CUI-ul pe site, sau numele plus telefonul ori localitatea din ANAF („sigur”); doar numele = „probabil”.
 */
const isRomanianSite = (s: SiteResult) => /\.ro$/.test(hostKey(s.url ?? "")) ||
  (s.text.match(/\b(și|pentru|lucrări|instalații|despre noi|contactează)\b/gi)?.length ?? 0) >= 3;

export async function findSite(firm: { cui: string; name: string; phone: string | null; city: string | null }): Promise<SiteResult | null> {
  let maybe: SiteResult | null = null;
  for (const d of domainGuesses(firm.name)) {
    const home = await get(`https://${d}/`, 8000) ?? await get(`https://www.${d}/`, 8000);
    if (!home || home.status >= 400 || home.html.length < 200) continue;
    if (isDirectoryHost(hostKey(home.url))) continue;
    const s = await site(home.url, firm.cui, 4);
    if (!s.reachable) continue;
    s.match = siteMatch(s, firm);
    if (s.match === "sigur") { const full = await site(s.url!, firm.cui); return full.reachable ? { ...full, match: "sigur" } : s; }
    // Doar numele nu ajunge pentru un domeniu ghicit (dorna.com, instal.com sunt altceva): cerem un site românesc.
    if (s.match === "probabil" && !maybe && isRomanianSite(s)) maybe = s;
  }
  if (!maybe) return null;
  const full = await site(maybe.url!, firm.cui);
  return full.reachable ? { ...full, match: "probabil" } : maybe;
}

async function enrich(cuis: string[], knownSites: Record<string, string> = {}) {
  const facts = await anaf(cuis);
  const out = [];
  for (const cui of Object.keys(facts)) {
    const f = facts[cui];
    let s: SiteResult | null = null;
    if (knownSites[cui]) s = await site(knownSites[cui], cui);
    else if (f.general) s = await findSite(f.general);
    out.push({ cui, ...f, site: s });
  }
  return out;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Text SQL sigur: dollar-quoting cu o etichetă care nu apare în text. */
function lit(text: string): string {
  let tag = "j";
  while (text.includes(`$${tag}$`)) tag += "x";
  return `$${tag}$${text}$${tag}$`;
}

async function anafGeneral(cuis: string[]): Promise<Record<string, AnafCompany>> {
  const today = new Date().toISOString().slice(0, 10);
  const out: Record<string, AnafCompany> = {};
  const list = [...new Set(cuis.map((c) => c.replace(/^RO/i, "")).filter((c) => isValidCui(c)))];
  for (let i = 0; i < list.length; i += 100) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await fetch("https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(list.slice(i, i + 100).map((cui) => ({ cui: Number(cui), data: today }))), signal: AbortSignal.timeout(30000) });
        for (const f of ((await r.json()) as { found?: unknown[] }).found ?? []) { const g = parseAnafTva(f); if (g) out[g.cui] = g; }
        break;
      } catch { await sleep(2000 * (attempt + 1)); }
    }
    await sleep(1200);
  }
  return out;
}

/** ANAF + filtrele dure: din CUI-urile primite rămân firmele noi pentru campanie, care trec mărimea, CAEN-ul și județul. */
type ScreenCampaign = { caen_codes: string[] | null; min_employees: number | null; max_employees: number | null; counties: string[] | null; min_turnover: number | null; knownCuis?: string[] };

async function screen(file: string, cuis: string[]) {
  const { readFile } = await import("node:fs/promises");
  const c = JSON.parse(await readFile(file, "utf8")) as ScreenCampaign;
  const known = new Set((c.knownCuis ?? []).map(String));
  const fresh = [...new Set(cuis.map((x) => x.replace(/^RO/i, "")))].filter((x) => isValidCui(x) && !known.has(x));
  const general = await anafGeneral(fresh);
  const passed = [], dropped: Record<string, number> = {};
  for (const cui of fresh) {
    const g = general[cui];
    if (!g) { dropped["negăsit la ANAF"] = (dropped["negăsit la ANAF"] ?? 0) + 1; continue; }
    // Întâi filtrele ieftine (stare, CAEN din registru, județ), abia apoi bilanțul (o cerere pe firmă).
    const pre = hardFilterReasons({ active: g.active, caen: g.caen, employees: null, county: g.county, turnover: null }, c);
    if (pre.length) { const k = pre[0].replace(/\d+/g, "N"); dropped[k] = (dropped[k] ?? 0) + 1; continue; }
    let fin: AnafFinancials | null = null;
    const y = new Date().getFullYear();
    for (const year of [y - 1, y - 2]) {
      try {
        const r = await fetch(`https://webservicesp.anaf.ro/bilant?an=${year}&cui=${cui}`, { signal: AbortSignal.timeout(20000) });
        fin = parseAnafBilant(await r.json());
        await sleep(1100);
        if (fin) break;
      } catch { await sleep(1500); }
    }
    const reasons = hardFilterReasons({ active: g.active, caen: fin?.caen ?? g.caen, employees: fin?.employees ?? null, county: g.county, turnover: fin?.turnover ?? null }, c);
    if (!fin) reasons.push("fără bilanț depus");
    if (reasons.length) { const k = reasons[0].replace(/\d+/g, "N"); dropped[k] = (dropped[k] ?? 0) + 1; continue; }
    passed.push({ ...g, financials: fin });
  }
  passed.sort((a, b) => (b.financials?.employees ?? 0) - (a.financials?.employees ?? 0));
  return { checked: fresh.length, skippedKnown: cuis.length - fresh.length, passed, dropped };
}

type SaveCompany = {
  name: string; cui?: string | null; website?: string | null; description?: string | null; county?: string | null; city?: string | null; address?: string | null;
  phone?: string | null; caen?: string | null; employees?: number | null; turnover?: number | null; profit?: number | null; fin_year?: number | null; reg_date?: string | null;
  fit_score?: number | null; fit_reason?: string | null; signals?: string[]; emails?: { email: string; kind: string; page?: string }[]; mx?: boolean | null;
  source?: string; source_detail?: string | null;
  people?: { name: string; role?: string | null; email?: string | null; email_status?: "pe_site" | "ghicit" | "lipsa"; linkedin?: string | null; source_url?: string | null }[];
};

/** SQL-ul care salvează firmele unei rulări și oamenii lor. Dublurile (același CUI sau același site în campanie) se sar. */
function saveSql(runId: string, body: { campaign_id: string; companies: SaveCompany[] }): string {
  if (!UUID.test(runId ?? "") || !UUID.test(body?.campaign_id ?? "")) throw new Error("save-sql <runId> cu {campaign_id, companies:[...]} pe stdin");
  const rows = (body.companies ?? []).filter((c) => c?.name).slice(0, 300).map((c) => ({
    ...c, campaign_id: body.campaign_id, run_id: runId, host: c.website ? hostKey(c.website) : null,
    cui: c.cui && isValidCui(c.cui) ? c.cui.replace(/^RO/i, "") : null,
    fit_score: c.fit_score == null ? null : Math.max(0, Math.min(100, Math.round(c.fit_score))),
    source: ["anre", "cautare", "onrc", "manual", "altul"].includes(c.source ?? "") ? c.source : "cautare",
    signals: (c.signals ?? []).map(String).slice(0, 12), emails: (c.emails ?? []).slice(0, 20),
  }));
  return `with src as (select * from jsonb_to_recordset(${lit(JSON.stringify(rows))}::jsonb) as x(
      campaign_id uuid, run_id uuid, name text, cui text, website text, host text, description text, county text, city text, address text, phone text,
      caen text, employees integer, turnover numeric, profit numeric, fin_year integer, reg_date date, fit_score integer, fit_reason text,
      signals text[], emails jsonb, mx boolean, source text, source_detail text, people jsonb)),
  ins as (insert into public.prospect_companies (campaign_id, run_id, name, cui, website, host, description, county, city, address, phone, caen, employees, turnover, profit,
      fin_year, reg_date, fit_score, fit_reason, signals, emails, mx, source, source_detail)
    select campaign_id, run_id, left(name, 200), cui, left(website, 300), host, left(description, 1500), county, city, address, phone, caen, employees, turnover, profit,
      fin_year, reg_date, fit_score, left(fit_reason, 1500), signals, coalesce(emails, '[]'::jsonb), mx, source, left(source_detail, 500) from src
    on conflict do nothing returning id, cui, host),
  ppl as (select ins.id as company_id, p.* from ins join src on (ins.cui is not null and ins.cui = src.cui) or (ins.host is not null and ins.host = src.host)
    cross join lateral jsonb_to_recordset(coalesce(src.people, '[]'::jsonb)) as p(name text, role text, email text, email_status text, linkedin text, source_url text)
    where coalesce(trim(p.name), '') <> ''),
  pins as (insert into public.prospect_people (company_id, name, role, email, email_status, linkedin, source_url)
    select company_id, left(name, 160), left(role, 160), left(email, 160),
      case when email_status in ('pe_site','ghicit') then email_status when email is not null then 'pe_site' else 'lipsa' end, left(linkedin, 300), left(source_url, 500) from ppl returning id)
  select (select count(*) from ins) as firme_salvate, (select count(*) from src) - (select count(*) from ins) as dubluri_sarite, (select count(*) from pins) as oameni;`;
}

async function sql(query: string) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/database/query`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }), signal: AbortSignal.timeout(60000),
  });
  const body = await r.text();
  if (!r.ok) throw new Error(`SQL ${r.status}: ${body.slice(0, 500)}`);
  return JSON.parse(body);
}

async function stdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  const print = (v: unknown) => process.stdout.write(JSON.stringify(v, null, 1) + "\n");
  if (cmd === "anaf") return print(await anaf(args));
  if (cmd === "site") {
    const s = await site(args[0], args[1]);
    if (args[1] && s.reachable) {
      const g = (await anafGeneral([args[1]]))[args[1]];
      if (g) s.match = siteMatch(s, g);
    }
    return print(s);
  }
  if (cmd === "cuis") return print(cuisFromSearchText(await stdin()));
  if (cmd === "screen") return print(await screen(args[0], args.slice(1)));
  if (cmd === "save-sql") return void process.stdout.write(saveSql(args[0], JSON.parse(await stdin())) + "\n");
  if (cmd === "finish-sql") {
    if (!UUID.test(args[0] ?? "")) throw new Error("finish-sql <runId>");
    const j = JSON.parse(await stdin()) as { summary?: string; stats?: Record<string, unknown>; queries?: string[]; status?: string };
    const body = JSON.stringify({ summary: String(j.summary ?? "").slice(0, 4000), stats: j.stats ?? {}, queries: (j.queries ?? []).map(String).slice(0, 200), status: j.status === "eroare" ? "eroare" : "gata" });
    return void process.stdout.write(`update public.prospect_runs r set status = x.status, summary = x.summary, stats = x.stats, queries = x.queries, finished_at = now()
  from jsonb_to_record(${lit(body)}::jsonb) as x(status text, summary text, stats jsonb, queries text[]) where r.id = '${args[0]}' returning r.id;\n`);
  }
  if (cmd === "find-site") {
    // find-site "<nume>" <cui> [telefon] [localitate]; fără telefon și localitate le ia din ANAF.
    const g = args[2] || args[3] ? null : (await anafGeneral([args[1]]))[args[1]];
    return print(await findSite({ cui: args[1], name: args[0], phone: args[2] || g?.phone || null, city: args[3] || g?.city || null }));
  }
  if (cmd === "enrich") {
    // `enrich 123 456=firma.ro`: după „=” poate veni site-ul deja cunoscut.
    const known: Record<string, string> = {};
    const list = args.map((a) => { const [c, s] = a.split("="); if (s) known[c] = s; return c; });
    return print(await enrich(list, known));
  }
  if (cmd === "sql") return print(await sql(await stdin()));
  process.stderr.write("Comenzi: anaf, site, find-site, enrich, cuis, screen, save-sql, finish-sql, sql. Vezi antetul fișierului.\n");
  process.exit(2);
}

main().catch((e) => { process.stderr.write(String(e?.stack ?? e) + "\n"); process.exit(1); });
