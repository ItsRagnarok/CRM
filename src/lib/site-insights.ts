// Analiza automată a site-ului (Super Admin → Analitice): reguli simple, verificabile, care merg mereu,
// fără cheie de AI. Fiecare recomandare spune ce s-a văzut în cifre și ce faci concret.
// Scopul: mai mulți vizitatori reali care ajung să ceară o discuție pe /programare.

import { pageName } from "./site-pages";

export type InsightPeriod = "1h" | "24h" | "7d" | "30d";
export const INSIGHT_PERIODS: { id: InsightPeriod; label: string; short: string }[] = [
  { id: "1h", label: "Ultima oră", short: "1 oră" },
  { id: "24h", label: "Ultimele 24 de ore", short: "24 h" },
  { id: "7d", label: "Ultimele 7 zile", short: "7 zile" },
  { id: "30d", label: "Ultimele 30 de zile", short: "30 zile" },
];

type Named = { name: string; visitors: number; leads?: number };
type Page = { path: string; visitors: number; views: number; avg_seconds: number | null };
type Journey = { entry: string; channel: string; pages: number; seconds: number; lead: boolean; device: string; trail?: string[]; steps?: { p: string; s: number | null }[] };
export type StatsInput = {
  visitors: number; views: number; bounce: number | null; avg_seconds: number | null;
  leads_count: number; bookings?: number; prev_visitors: number;
  pages: Page[]; entries: { path: string; visitors: number }[]; channels: Named[];
  sources: Named[]; devices: Named[]; regions?: { country: string; region: string; visitors: number }[];
  journeys: Journey[];
};

export type Recommendation = {
  id: string;
  title: string;
  why: string;
  steps: string[];
  impact: "mare" | "mediu" | "mic";
  effort?: "mic" | "mediu" | "mare";
  link?: { href: string; label: string };
  source: "reguli" | "ai";
};

export type InsightSummary = {
  visitors: number; views: number; leads: number; conversion: number | null; bounce: number | null;
  avgSeconds: number | null; mobileShare: number | null; prevVisitors: number; programareVisitors: number;
};

const pct = (a: number, b: number) => (b > 0 ? Math.round((100 * a) / b) : null);

export function summarize(s: StatsInput): InsightSummary {
  const mobile = s.devices.filter((d) => d.name === "mobile").reduce((a, d) => a + d.visitors, 0);
  const leads = Math.max(s.leads_count ?? 0, s.bookings ?? 0);
  return {
    visitors: s.visitors, views: s.views, leads, conversion: pct(leads, s.visitors), bounce: s.bounce,
    avgSeconds: s.avg_seconds, mobileShare: pct(mobile, s.devices.reduce((a, d) => a + d.visitors, 0)),
    prevVisitors: s.prev_visitors, programareVisitors: s.pages.find((p) => p.path === "/programare")?.visitors ?? 0,
  };
}

/** „Campanie: linkedin” → „LinkedIn (link marcat)”: linkurile marcate pe rețele sunt postări, nu firme. */
export function socialCampaign(name: string): string | null {
  const m = /^Campanie: (linkedin|facebook|fb|instagram|tiktok|whatsapp|grup[\w-]*)$/i.exec(name);
  if (!m) return null;
  const k = m[1].toLowerCase();
  const label = k === "fb" || k === "facebook" ? "Facebook" : k === "linkedin" ? "LinkedIn" : k === "instagram" ? "Instagram" : k === "tiktok" ? "TikTok" : k === "whatsapp" ? "WhatsApp" : "Grup";
  return `${label} (link marcat)`;
}

/** Recomandările din reguli, ordonate după impact. Puține și concrete; nimic dacă datele sunt prea puține. */
export function ruleRecommendations(s: StatsInput, period: InsightPeriod): Recommendation[] {
  const out: Recommendation[] = [];
  const sum = summarize(s);
  const prog = s.pages.find((p) => p.path === "/programare");
  const home = s.pages.find((p) => p.path === "/");
  const blogPages = s.pages.filter((p) => p.path.startsWith("/blog/"));
  const blogVisitors = s.pages.filter((p) => p.path.startsWith("/blog")).reduce((a, p) => a + p.visitors, 0);
  const google = s.channels.find((c) => c.name === "Google")?.visitors ?? 0;
  const direct = s.channels.find((c) => c.name === "Direct")?.visitors ?? 0;
  const social = s.channels.filter((c) => /facebook|instagram|linkedin/i.test(c.name)).reduce((a, c) => a + c.visitors, 0);
  const campaigns = s.channels.filter((c) => c.name.startsWith("Campanie: ") && !socialCampaign(c.name));

  if (s.visitors === 0) {
    out.push({
      id: "fara-trafic", source: "reguli", impact: "mare", effort: "mic",
      title: "Nimeni pe site în această perioadă",
      why: `În ${INSIGHT_PERIODS.find((p) => p.id === period)?.label.toLowerCase()} nu a intrat niciun vizitator (vizitele tale sunt excluse).`,
      steps: ["Trimite azi 3–5 mesaje către lead-uri, cu linkul de programare marcat (?utm_source=numele-firmei).", "Postează un articol din blog pe LinkedIn și în 1–2 grupuri de instalatori."],
    });
    return out;
  }

  // 1. Pagina de programare: cine ajunge acolo și pleacă fără să trimită.
  if (prog && prog.visitors >= 2 && sum.leads === 0) {
    out.push({
      id: "programare-abandon", source: "reguli", impact: "mare", effort: "mic",
      title: "Oamenii deschid programarea, dar nu trimit",
      why: `${prog.visitors} vizitatori au deschis ${pageName("/programare")}${prog.avg_seconds != null ? `, cu ${prog.avg_seconds} secunde în medie pe pagină` : ""}, și nicio cerere nu a fost trimisă.`,
      steps: [
        "Deschide pagina pe telefon și încearcă să faci o programare ca un client: câți pași sunt, ce câmpuri cere, se încarcă repede?",
        "Lasă doar ce e necesar (nume, telefon, zi și oră); restul îl afli la apel.",
        "Pune sus un rând care spune ce primește omul: „15 minute, îți arăt pe lucrările tale, fără obligații”.",
        "Adaugă și varianta rapidă: numărul de telefon / WhatsApp vizibil, pentru cine nu vrea formular.",
      ],
      link: { href: "/programare", label: "Deschide pagina de programare" },
    });
  }

  // 2. Prima pagină: mulți intră, puțini merg mai departe.
  const homeEntries = s.entries.find((e) => e.path === "/")?.visitors ?? 0;
  if (home && homeEntries >= 5 && (s.bounce ?? 0) >= 55) {
    const toProg = s.journeys.filter((j) => j.entry === "/" && (j.trail ?? j.steps?.map((x) => x.p) ?? []).includes("/programare")).length;
    out.push({
      id: "home-bounce", source: "reguli", impact: "mare", effort: "mediu",
      title: "Prima pagină nu duce spre programare",
      why: `${homeEntries} vizitatori au intrat pe prima pagină; ${s.bounce}% au plecat după o singură pagină, iar ${toProg} au ajuns la programare.`,
      steps: [
        "Butonul „Programează o discuție” trebuie să fie vizibil fără scroll, pe telefon și pe calculator.",
        "Sub titlu, o propoziție cu rezultatul concret (ex. „Echipele știu dimineața unde merg, biroul nu mai sună după poze”), nu o listă de funcții.",
        "Repetă butonul după fiecare secțiune mare și pune 2–3 capturi reale din aplicație.",
      ],
      link: { href: "/", label: "Vezi prima pagină" },
    });
  }

  // 3. Blogul aduce oameni, dar nu-i trimite mai departe.
  if (blogVisitors >= 3) {
    const fromBlog = s.journeys.filter((j) => j.entry.startsWith("/blog") && (j.trail ?? []).includes("/programare")).length;
    const top = [...blogPages].sort((a, b) => b.visitors - a.visitors).slice(0, 3);
    out.push({
      id: "blog-cta", source: "reguli", impact: "mediu", effort: "mic",
      title: "Cititorii blogului nu ajung la programare",
      why: `${blogVisitors} vizitatori au citit blogul; ${fromBlog} dintre cei care au intrat prin blog au deschis programarea.${top.length ? ` Cele mai citite: ${top.map((p) => `„${pageName(p.path)}”`).join(", ")}.` : ""}`,
      steps: [
        "În fiecare articol, după primul paragraf și la final, un bloc scurt: problema din articol + „Vezi cum arată în ElectroField” → /programare.",
        "Scrie încă 1–2 articole pe aceeași temă cu cel mai citit articol (oamenii caută exact asta).",
      ],
      link: top[0] ? { href: top[0].path, label: "Deschide cel mai citit articol" } : { href: "/blog", label: "Deschide blogul" },
    });
  }

  // 4. Linkurile marcate trimise lead-urilor: cine a deschis.
  for (const c of campaigns) {
    const name = c.name.replace("Campanie: ", "");
    out.push({
      id: `campanie-${name}`, source: "reguli", impact: "mare", effort: "mic",
      title: `${name} a deschis linkul trimis de tine`,
      why: `${c.visitors} ${c.visitors === 1 ? "vizitator a intrat" : "vizitatori au intrat"} pe linkul marcat „${name}”${c.leads ? ` și ${c.leads} a cerut programare` : ", dar nu a cerut încă programare"}.`,
      steps: c.leads
        ? ["Pregătește apelul: deschide prezentarea făcută pentru ei și notează 3 întrebări."]
        : ["Scrie-i azi un mesaj scurt: „Am văzut că ai aruncat o privire. Vrei să-ți arăt în 15 minute pe o lucrare de-a voastră?”", "Propune două ore concrete, nu „când ai timp”."],
    });
  }

  // 5. Mobilul.
  if ((sum.mobileShare ?? 0) >= 40 && sum.leads === 0 && s.visitors >= 5) {
    out.push({
      id: "mobil", source: "reguli", impact: "mediu", effort: "mic",
      title: "Mulți intră de pe telefon",
      why: `${sum.mobileShare}% dintre vizitatori sunt pe telefon. Pe telefon, un formular lung sau un buton ascuns pierde clientul.`,
      steps: ["Verifică pe un telefon real: butonul de programare e vizibil din prima, formularul se completează ușor, tastatura numerică apare la telefon.", "Pune un buton „Sună” / „WhatsApp” fix jos pe ecran, pe telefon."],
    });
  }

  // 6. Surse: prea dependent de direct / Google, fără social.
  if (s.visitors >= 10 && social === 0) {
    out.push({
      id: "social", source: "reguli", impact: "mediu", effort: "mediu",
      title: "Nu vine nimeni din LinkedIn sau Facebook",
      why: `Vizitatorii vin din „Direct” (${direct}) și Google (${google}); din rețelele sociale, niciunul.`,
      steps: ["Postează săptămânal pe LinkedIn: o problemă reală de pe teren + soluția + link marcat (?utm_source=linkedin).", "Intră în 2–3 grupuri de electricieni / instalatori / fotovoltaice și răspunde la întrebări, cu linkul spre articolul potrivit."],
    });
  }

  // 7. Trafic în scădere.
  if (s.prev_visitors >= 5 && s.visitors < s.prev_visitors * 0.6) {
    out.push({
      id: "scadere", source: "reguli", impact: "mediu", effort: "mic",
      title: "Mai puțini vizitatori decât în perioada dinainte",
      why: `${s.visitors} vizitatori acum, față de ${s.prev_visitors} în perioada anterioară de aceeași lungime.`,
      steps: ["Verifică dacă s-a oprit ceva: un articol nou, un mesaj trimis, o postare. Reia ce a mers.", "Programează următoarele 2 articole de blog și 5 mesaje către lead-uri."],
    });
  }

  const order = { mare: 0, mediu: 1, mic: 2 };
  return out.sort((a, b) => order[a.impact] - order[b.impact]).slice(0, 7);
}

/** Datele trimise la AI: doar cifre agregate, fără nimic care să identifice o persoană. */
export function compactForAi(s: StatsInput, period: InsightPeriod) {
  return {
    perioada: INSIGHT_PERIODS.find((p) => p.id === period)?.label,
    rezumat: summarize(s),
    pagini: s.pages.slice(0, 12).map((p) => ({ pagina: pageName(p.path), cale: p.path, vizitatori: p.visitors, afisari: p.views, secunde_medii: p.avg_seconds })),
    pagini_de_intrare: s.entries.slice(0, 8).map((e) => ({ pagina: pageName(e.path), vizitatori: e.visitors })),
    // „Campanie: linkedin” e o postare a patronului, nu o firmă: o numim așa ca AI-ul să nu le confunde.
    surse: s.channels.map((c) => ({ sursa: socialCampaign(c.name) ?? c.name, vizitatori: c.visitors, cereri: c.leads ?? 0 })),
    dispozitive: s.devices,
    judete: (s.regions ?? []).slice(0, 10).map((r) => ({ judet: r.region, vizitatori: r.visitors })),
    drumuri: s.journeys.slice(0, 25).map((j) => ({
      intrare: pageName(j.entry), sursa: j.channel, dispozitiv: j.device, pagini: j.pages, secunde: j.seconds, a_cerut_programare: j.lead,
      traseu: (j.steps ?? []).map((x) => `${pageName(x.p)}${x.s ? ` (${x.s}s)` : ""}`).slice(0, 10),
    })),
  };
}

// ---------------------------------------------------------------------------
// Filtrul pentru recomandările AI: păstrează doar ce se poate face cu ce ai și ce se sprijină pe cifre reale.
// Rulează în cod, după răspunsul AI, oricât de bine ar respecta AI-ul regulile.

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Lucruri pe care site-ul nu le are, sau afirmații pe care AI-ul nu le poate ști. Se aplică pe orice propoziție. */
const IMPOSSIBLE: { re: RegExp; reason: string }[] = [
  { re: /google analytics|\bga4?\b|search console|tag manager|\bgtm\b/, reason: "cere Google Analytics / Search Console, pe care site-ul nu le folosește" },
  { re: /hotjar|microsoft clarity|heatmap|harta termica|hart[ai] de caldura|inregistr\w* (de |ale )?sesiun|miscarea mouse|smartlook|lucky orange|mouseflow/, reason: "cere un instrument de hărți termice sau înregistrări, care nu e instalat" },
  { re: /(facebook|meta|tiktok|linkedin|google) pixel|pixel(ul|ului)? (facebook|meta|tiktok|linkedin|de urmarire|de tracking)|\bpixelul\b|remarketing|retargeting|lookalike|audient\w* personalizat/, reason: "cere pixeli de urmărire sau remarketing, care nu există pe site" },
  { re: /newsletter|lista de e-?mail|abonati|mailchimp|in schimbul (adresei|e-?mail)|lead magnet/, reason: "cere o listă de e-mail sau un newsletter, pe care nu le ai" },
  { re: /\ba\/b\b|test(e|are)? a\/?b|split test/, reason: "cere teste A/B, fără instrument și cu prea puțin trafic" },
  { re: /pop-?up|exit[- ]intent/, reason: "cere un pop-up, care nu există pe site" },
  { re: /chat ?bot|live ?chat|chat live|widget de chat|tawk|tidio|intercom|\bsms\b/, reason: "cere un chat sau SMS-uri, care nu există pe site" },
  { re: /google ads|facebook ads|meta ads|adwords|sponsoriz|reclam\w* platit|promov\w* platit|buget\w* (de|pentru) (reclam|publicit|ads)|\b\d+\s*(lei|ron|euro|eur)\s*(\/|pe)\s*(zi|luna|saptamana)/, reason: "cere reclame plătite, pentru care nu e stabilit un buget" },
  { re: /dupa ip|leadfeeder|albacross|identifica\w*[^.]{0,30}firm\w*[^.]{0,20}(intrat|vizit)/, reason: "vizitatorii sunt anonimi: nu se poate afla ce firme au intrat" },
  { re: /(e-?mail|mesaj)\w* automat|automat\w*[^.]{0,40}(e-?mail|mesaj|trimit)/, reason: "cere mesaje automate către vizitatori, care nu există" },
  { re: /export\w*[^.]{0,40}(\bip|e-?mail|adres|list[aei])/, reason: "cere exportul unor date despre vizitatori, care nu există" },
  { re: /media (industriei|pietei)|media din industrie|conform (google|studiilor|statisticilor)|studii\w* arata|benchmark|dintre utilizatorii/, reason: "citează statistici din afara datelor tale, pe care nu le poate verifica" },
  { re: /\b(vei (avea|obtine|primi|creste)|cre(sc|st)\w*|dubl\w*|tripl\w*)\b[^.]{0,40}\d/, reason: "promite rezultate în cifre, pe care nu le poate ști dinainte" },
  { re: /\b(o suta|sute de|o mie|mii de|zeci de|unsprezece|doisprezece|treisprezece|paisprezece|cincisprezece|saisprezece|saptesprezece|optsprezece|nouasprezece|douazeci|treizeci|patruzeci|cincizeci|saizeci)\b/, reason: "scrie cifrele în litere, așa că nu pot fi verificate în date" },
  { re: /\bfirm\w* (linkedin|facebook|instagram|grup)/, reason: "tratează o rețea socială ca pe o firmă" },
];

/** Contactarea vizitatorilor anonimi: verificată doar pe propozițiile care nu sunt despre schimbări pe pagină. */
const PAGE_EDIT = /\b(pune|adauga|afiseaza|arata|muta|schimba|inlocuieste|rescrie|scurteaza|sterge|buton\w*|pe pagina|sus pe|jos pe|vizibil\w*|formular\w*|camp(ul|uri|urile)?|titlu\w*|subsol|footer|verifica)\b/;
const CONTACT: { re: RegExp; reason: string }[] = [
  { re: /reia legatura|recontact\w*|follow-?up|(trimite|scrie|suna|contacteaz|da|ofera)\w*(-le|-i)?\b[^.]{0,60}(vizitator\w*|utilizator\w*|oamenii (care|de pe)|oamenilor care|persoan\w* care|\bcei \d+|\bcelor \d+|cei care au|celor care au|celor interesati|cei interesati|celor veniti|cei veniti)/, reason: "propune contactarea vizitatorilor anonimi; doar cei care cer programare își lasă datele" },
  { re: /(adres\w* de e-?mail|e-?mail\w*|numer\w* de telefon|telefoan\w*|\bip-?uri\w*|date\w* de contact)\s+(ale|al|a)\s+(vizitator\w*|celor|acestor|utilizator\w*)|(ai|obtii|colecteaz|strang)\w*[^.]{0,20}(e-?mail|telefoan|date\w* de contact|\bip)[^.]{0,20}(vizit|utilizator)/, reason: "presupune că ai datele de contact ale vizitatorilor; sunt anonimi" },
];

const SOCIAL = /^(linkedin|facebook|fb|instagram|tiktok|whatsapp|grup.*)$/;

type DataNumbers = { all: Set<string>; counts: Set<string>; seconds: Set<string>; percents: Set<string> };
const COUNT_KEYS = /^(vizitatori|afisari|cereri|visitors|views|leads|programareVisitors|prevVisitors|pagini)$/;
const SECOND_KEYS = /^(secunde|secunde_medii|avgSeconds|seconds)$/;
const PERCENT_KEYS = /^(conversion|bounce|mobileShare)$/;

/** Cifrele din datele trimise la AI, separate pe fel: număr de oameni, secunde, procente, și toate la un loc. */
function dataNumbers(data: unknown): DataNumbers {
  const out: DataNumbers = { all: new Set(), counts: new Set(), seconds: new Set(), percents: new Set() };
  const add = (n: string, key: string) => {
    out.all.add(n);
    if (COUNT_KEYS.test(key)) out.counts.add(n);
    if (SECOND_KEYS.test(key)) out.seconds.add(n);
    if (PERCENT_KEYS.test(key)) out.percents.add(n);
  };
  const walk = (v: unknown, key: string) => {
    if (typeof v === "number" && Number.isFinite(v)) add(String(Math.round(v * 100) / 100), key);
    else if (typeof v === "string") {
      for (const m of v.matchAll(/(\d+(?:[.,]\d+)?)(s\b)?/g)) {
        const n = m[1].replace(",", ".");
        out.all.add(n);
        if (m[2]) out.seconds.add(n); // „Pagina (45s)” din trasee
      }
    } else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, k);
  };
  walk(data, "");
  return out;
}

/** Felul cifrei după cuvântul de după ea: oameni / secunde / procent / altceva. */
function kindOf(after: string): "counts" | "seconds" | "percents" | "all" {
  const a = norm(after).trimStart();
  if (/^%/.test(a)) return "percents";
  if (/^(de\s+)?(secunde|sec\b|s\b)/.test(a)) return "seconds";
  if (/^(de\s+)?(vizitator|oameni|persoane|utilizator|afisar|cereri|programari|vizite|sesiuni|intrari|clienti)/.test(a)) return "counts";
  return "all";
}

/** Căile de pagini care apar în date: doar acolo poate duce butonul „Deschide pagina”. */
function dataPaths(data: unknown): Set<string> {
  const out = new Set<string>(["/", "/programare", "/blog"]);
  const walk = (v: unknown) => {
    if (typeof v === "string" && /^\/[A-Za-z0-9/_.-]*$/.test(v)) out.add(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(data);
  return out;
}

export type RejectedRecommendation = { title: string; reason: string };

/**
 * Păstrează doar recomandările AI care:
 * - nu cer ceva ce nu ai (date de contact ale vizitatorilor, Google Analytics, pop-up-uri, newsletter...);
 * - citează în „de ce” cel puțin o cifră din date și nicio cifră inventată (procentele calculate sunt permise);
 * - duc, dacă au link, doar spre o pagină care apare în date.
 * Cele aruncate se întorc cu motivul, ca patronul să vadă ce s-a filtrat.
 */
export function groundAiRecommendations(recs: Recommendation[], data: unknown): { kept: Recommendation[]; rejected: RejectedRecommendation[] } {
  const nums = dataNumbers(data);
  const paths = dataPaths(data);
  const d = (data ?? {}) as { surse?: { sursa?: string; vizitatori?: number }[]; pagini?: { pagina?: string; vizitatori?: number }[]; pagini_de_intrare?: { pagina?: string; vizitatori?: number }[]; judete?: { judet?: string; vizitatori?: number }[] };
  // Firmele cărora patronul le-a trimis personal link marcat: singurele „vizite” pe care le poate contacta.
  const firms = (d.surse ?? []).map((s) => norm(s.sursa ?? "")).filter((s) => s.startsWith("campanie: ")).map((s) => s.slice(10).trim()).filter((s) => s && !SOCIAL.test(s));
  // Cifra de vizitatori a fiecărei surse / pagini / județ, ca să nu fie atribuită altcuiva.
  const entity = new Map<string, Set<string>>();
  const addEnt = (name: string | undefined, v: number | undefined) => {
    const n = norm(name ?? "").replace(/^campanie: /, "").trim();
    if (n.length < 4 || typeof v !== "number") return;
    if (!entity.has(n)) entity.set(n, new Set());
    entity.get(n)!.add(String(v));
  };
  for (const s of d.surse ?? []) addEnt(s.sursa, s.vizitatori);
  for (const s of [...(d.pagini ?? []), ...(d.pagini_de_intrare ?? [])]) addEnt(s.pagina, s.vizitatori);
  for (const s of d.judete ?? []) addEnt(s.judet, s.vizitatori);
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

  const kept: Recommendation[] = [];
  const rejected: RejectedRecommendation[] = [];
  const reject = (r: Recommendation, reason: string) => rejected.push({ title: r.title, reason });

  for (const r of recs) {
    const sentences = norm([r.title, r.why, ...r.steps].join(". ")).split(/(?<=[.!?;])\s+|\n+/);
    const bad = IMPOSSIBLE.find((b) => sentences.some((s) => b.re.test(s)))
      ?? CONTACT.find((b) => sentences.some((s) => !PAGE_EDIT.test(s) && !firms.some((f) => s.includes(f)) && b.re.test(s)));
    if (bad) { reject(r, bad.reason); continue; }

    // Minutele se compară cu secundele din date.
    const why = norm(r.why).replace(/(\d+)\s*minut\w*(?:\s*si\s*(\d+)\s*(?:de\s+)?secunde)?/g, (_m, a, b) => `${Number(a) * 60 + Number(b ?? 0)} secunde`);
    const pairs = [...why.matchAll(/(\d+)\s+din\s+(\d+)/g)].filter((m) => nums.all.has(m[1]) && nums.all.has(m[2]));
    const cited = [...why.matchAll(/(\d+(?:[.,]\d+)?)/g)].map((m) => {
      const n = m[1].replace(",", ".");
      const kind = kindOf(why.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 20));
      return { n, kind, inData: kind === "all" ? nums.all.has(n) : nums[kind].has(n) };
    });
    const grounded = cited.filter((c) => c.inData).map((c) => Number(c.n));
    const invented = cited.filter((c) => {
      if (c.inData) return false;
      const n = Number(c.n);
      // Un procent: din date (plecări, conversie, telefon) sau calculat dintr-o pereche „A din B” scrisă alături.
      if (c.kind === "percents") return !(n <= 100 && pairs.some((m) => Math.round((100 * Number(m[1])) / Number(m[2])) === n));
      // O sumă sau o diferență a două cifre din date, scrise amândouă în aceeași explicație.
      if (c.kind === "counts" && grounded.some((a) => grounded.some((b) => a !== b && (a + b === n || Math.abs(a - b) === n)))) return false;
      return true;
    });
    if (invented.length) { reject(r, `citează cifre care nu apar în date (${invented.map((c) => c.n + (c.kind === "percents" ? "%" : "")).join(", ")})`); continue; }
    if (!grounded.length) { reject(r, "nu citează nicio cifră din datele site-ului"); continue; }

    // O cifră reală pusă la sursa sau pagina greșită (ex. Google cu vizitatorii de la Direct).
    let misattributed = "";
    for (const [name, values] of entity) {
      for (const m of why.matchAll(new RegExp(`${esc(name)}[^.\\d]{0,40}?(\\d+)\\s*(?:de\\s+)?(vizitator|oameni|persoane)`, "g"))) {
        if (!values.has(m[1])) { misattributed = `${m[1]} la „${name}”`; break; }
      }
      if (misattributed) break;
    }
    if (misattributed) { reject(r, `pune o cifră la sursa sau pagina greșită (${misattributed})`); continue; }

    // În pași: fără procente și fără număr de oameni care nu există în date (promisiuni).
    const stepText = norm(r.steps.join(" "));
    if (/\d+\s*%/.test(stepText)) { reject(r, "pune procente în pași, care nu se pot verifica"); continue; }
    const promised = [...stepText.matchAll(/(\d+)\s*(?:de\s+)?(cereri|programari|clienti|vizitator\w*)/g)].find((m) => !nums.counts.has(m[1]));
    if (promised) { reject(r, `promite în pași un număr de oameni sau cereri care nu e în date (${promised[1]} ${promised[2]})`); continue; }

    kept.push(r.link && !paths.has(r.link.href) ? { ...r, link: undefined } : r);
  }
  return { kept, rejected };
}
