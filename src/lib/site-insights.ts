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
  const campaigns = s.channels.filter((c) => c.name.startsWith("Campanie: "));

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
    surse: s.channels.map((c) => ({ sursa: c.name, vizitatori: c.visitors, cereri: c.leads ?? 0 })),
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

/** Lucruri pe care site-ul nu le are sau care cer date pe care nu le ai. Fiecare are motivul arătat patronului. */
const IMPOSSIBLE: { re: RegExp; reason: string }[] = [
  { re: /google analytics|\bga4?\b|search console|tag manager|\bgtm\b/, reason: "cere Google Analytics / Search Console, pe care site-ul nu le folosește" },
  { re: /hotjar|microsoft clarity|heatmap|harta termica|hart[ai] de caldura|inregistrari? de sesiune/, reason: "cere un instrument de hărți termice sau înregistrări, care nu e instalat" },
  { re: /pixel|remarketing|retargeting|lookalike|audient[ae] personalizat/, reason: "cere pixeli sau remarketing, care nu există pe site" },
  { re: /newsletter|lista de e-?mail|abonati|abonatilor|mailchimp/, reason: "cere o listă de e-mail sau un newsletter, pe care nu le ai" },
  { re: /\ba\/b\b|test(e|are)? a\/?b|split test/, reason: "cere teste A/B, fără instrument și cu prea puțin trafic" },
  { re: /pop-?up|exit[- ]intent/, reason: "cere un pop-up, care nu există pe site" },
  { re: /export\w*[^.]{0,40}(\bip|e-?mail|adres|list[aei])/, reason: "cere exportul unor date despre vizitatori, care nu există" },
  { re: /(adres\w* de e-?mail|e-?mail\w*|telefo\w*|\bip-?uri\w*|date\w* de contact)[^.]{0,30}(vizitator|celor \d+|cei \d+)/, reason: "presupune că ai datele de contact ale vizitatorilor; sunt anonimi" },
  { re: /(e-?mail|follow-?up|sun[aăi]|contacteaz\w*|scrie-le|mesaj\w*)[^.]{0,60}(\bcelor \d+|\bcei \d+)?[^.]{0,20}vizitator/, reason: "propune contactarea vizitatorilor anonimi; doar cei care cer programare își lasă datele" },
];

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
  if (/^(de\s+)?(secunde|sec\b|s\b|minut)/.test(a)) return "seconds";
  if (/^(de\s+)?(vizitator|oameni|persoane|utilizator|afisar|cereri|programari|vizite|sesiuni|intrari)/.test(a)) return "counts";
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
  const kept: Recommendation[] = [];
  const rejected: RejectedRecommendation[] = [];
  for (const r of recs) {
    const sentences = norm([r.title, r.why, ...r.steps].join(". ")).split(/(?<=[.!?;])\s+|\n+/);
    const bad = IMPOSSIBLE.find((b) => sentences.some((s) => !/campani|utm_source|link\w* marcat|\blead/.test(s) && b.re.test(s)));
    if (bad) { rejected.push({ title: r.title, reason: bad.reason }); continue; }
    const cited = [...r.why.matchAll(/(\d+(?:[.,]\d+)?)/g)].map((m) => {
      const n = m[1].replace(",", ".");
      const kind = kindOf(r.why.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 20));
      // Un procent poate fi calculat din două cifre din date; restul trebuie să existe, de același fel.
      const ok = kind === "percents" ? true : kind === "all" ? nums.all.has(n) : nums[kind].has(n);
      return { n, ok, inData: nums.all.has(n) };
    });
    const grounded = cited.filter((c) => c.ok && c.inData);
    const invented = cited.filter((c) => !c.ok);
    if (invented.length) { rejected.push({ title: r.title, reason: `citează cifre care nu apar în date (${invented.map((c) => c.n).join(", ")})` }); continue; }
    if (!grounded.length) { rejected.push({ title: r.title, reason: "nu citează nicio cifră din datele site-ului" }); continue; }
    kept.push(r.link && !paths.has(r.link.href) ? { ...r, link: undefined } : r);
  }
  return { kept, rejected };
}
