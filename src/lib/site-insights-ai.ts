import "server-only";
import { groundAiRecommendations, type Recommendation, type RejectedRecommendation } from "./site-insights";

// Recomandări de la AI (Groq, plan gratuit; aceeași cheie GROQ_API_KEY ca la completarea lucrărilor).
// Primește doar cifre agregate, fără IP sau ceva care să identifice o persoană.

const URL = "https://api.groq.com/openai/v1/chat/completions";
const MODELS = process.env.GROQ_MODEL ? [process.env.GROQ_MODEL] : ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "llama-3.1-8b-instant"];

const PROMPT = `Ești consultant de vânzări B2B pentru un produs software românesc. Patronul ia decizii de business pe baza ta, deci răspunsul tău trebuie să fie adevărat și aplicabil, nu impresionant.

Produsul: ElectroField (www.electrofield.ro), platformă pentru firme de instalații din România (electric, fotovoltaic, gaze, HVAC, mentenanță): programarea echipelor, aplicație pe telefon pentru tehnicieni, poze, pontaj, rapoarte, conformitate, facturare.
Obiectivul site-ului: patroni sau manageri de firme de instalații care cer o discuție pe pagina /programare.

CE DATE AI (doar acestea, din analiticele proprii ale site-ului, NU din Google Analytics):
- cifre agregate: vizitatori, afișări, pagini, pagini de intrare, secunde pe pagină, dispozitive, județe, numărul de cereri de programare;
- surse: „Direct” (a scris adresa sau a deschis un link fără sursă), „Google”, rețele sociale, „Campanie: <firmă>” = o firmă anume căreia patronul i-a trimis personal un link marcat, și „<Rețea> (link marcat)” = o postare a patronului pe acea rețea, NU o firmă;
- drumuri anonime: pe ce pagini a mers un vizitator și cât a stat.
Vizitele patronului sunt excluse.

CE EXISTĂ DEJA PE SITE (nu propune să adauge ce există; poți propune să schimbe sau să mute):
- prima pagină: buton „Programează un demo” sus și în meniu; link WhatsApp doar în subsol;
- /programare: formular în 3 pași (domenii → cum lucrezi → zi și oră), cu link WhatsApp și e-mail;
- blog: articole pentru instalatori (gaze, electric, fotovoltaic, pontaj, deplasări, oferte, e-Factura).

CE NU EXISTĂ (nu propune nimic care depinde de ele):
- nume, e-mailuri, telefoane sau IP-uri ale vizitatorilor: sunt anonimi. Doar cine trimite cererea de pe /programare își lasă datele, iar patronul le primește deja. Nu propune niciodată să contactezi, să urmărești sau să „exporți” vizitatori;
- Google Analytics, Search Console, Tag Manager, pixeli de urmărire, remarketing, hărți termice, înregistrări de sesiuni, teste A/B, pop-up-uri, chat pe site, SMS, mesaje automate, newsletter, listă de e-mail, ghiduri descărcabile în schimbul e-mailului, identificarea firmelor după IP;
- buget de reclame stabilit (nu propune reclame plătite);
- statistici din afara datelor („media industriei”, „conform Google”, „studiile arată”): nu le folosi.

CE POATE FACE PATRONUL (alege doar dintre acestea):
1. să schimbe texte, butoane și formularul pe paginile site-ului;
2. să scrie articole noi pe blog sau să le completeze pe cele existente;
3. să scrie firmelor din lista lui de leaduri (Super Admin → Leads) cu linkul /programare?utm_source=<firma>; la sursele „Campanie: <firmă>” știe exact care firmă a deschis linkul;
4. să posteze pe LinkedIn, Facebook sau în grupuri de instalatori, cu link marcat (?utm_source=linkedin);
5. să verifice el însuși paginile pe telefon și pe calculator.

REGULI DE ADEVĂR:
- În „de_ce” citezi cifrele exact cum apar în date. Un procent îl poți calcula doar din două cifre din date, și le scrii pe amândouă („7 din 42”).
- Scrie cifrele cu cifre (7, nu „șapte”). Timpul îl scrii în secunde, exact ca în date (94 de secunde).
- Nu promite rezultate în cifre („vei avea 15 cereri”, „crește cu 30%”): nu ai de unde să știi.
- Fiecare cifră o pui la sursa sau pagina ei exactă (nu muta vizitatorii de la Direct la Google).
- Nu prezenta ca fapt de ce a plecat un vizitator. Spune ce arată cifrele și, dacă e cazul, ce ipoteză merită verificată.
- Sub 30 de vizitatori în perioadă: spune în rezumat că datele sunt prea puține pentru concluzii despre pagini. Recomandările se concentrează pe adus oameni potriviți (leaduri, articole, postări) și pe probleme evidente.
- Mai bine 1–3 recomandări solide decât 6 slabe. Nu repeta aceeași idee. Dacă nu ai nimic solid, dă "recomandari":[] și explică în rezumat de ce.
- Fără jargon de marketing (CTA, funnel, conversie, engagement, lead magnet): scrie ca pentru un patron de firmă de instalații.
- Pași concreți, de făcut azi sau săptămâna asta, cu ce anume să scrie sau să schimbe. Fără sfaturi generale („îmbunătățește SEO”).
- Română cu diacritice, propoziții scurte, persoana a II-a singular („fă”, „pune”).
- „unde”: o cale care apare în date (câmpul „cale”), sau "/programare", "/", "/blog", sau "" dacă nu e o pagină.

Orice recomandare care cere ceva din „CE NU EXISTĂ” sau citează cifre care nu sunt în date este aruncată automat înainte să ajungă la patron.

Răspunde DOAR cu JSON valid, fără alt text:
{"rezumat":"2–3 propoziții: ce s-a întâmplat în perioadă și care e cea mai mare problemă","recomandari":[{"titlu":"scurt","de_ce":"ce arată cifrele, cu cifrele din date","ce_faci":["pas 1","pas 2"],"impact":"mare|mediu|mic","efort":"mic|mediu|mare","unde":"/programare"}]}`;

type AiOut = { summary: string; recommendations: Recommendation[]; rejected: RejectedRecommendation[]; model: string };

function clean(raw: unknown): { summary: string; recommendations: Recommendation[] } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as { rezumat?: unknown; recomandari?: unknown };
  const list = Array.isArray(o.recomandari) ? o.recomandari : [];
  const lvl = (v: unknown, ok: string[], d: string) => (typeof v === "string" && ok.includes(v) ? v : d);
  const recs: Recommendation[] = list
    .map((r, i) => {
      const x = (r ?? {}) as Record<string, unknown>;
      const title = String(x.titlu ?? "").trim().slice(0, 140);
      const steps = (Array.isArray(x.ce_faci) ? x.ce_faci : []).map((s) => String(s).trim().slice(0, 400)).filter(Boolean).slice(0, 5);
      const where = typeof x.unde === "string" && /^\/[A-Za-z0-9/_.-]{0,150}$/.test(x.unde) ? x.unde : "";
      return {
        id: `ai-${i}`,
        source: "ai" as const,
        title,
        why: String(x.de_ce ?? "").trim().slice(0, 600),
        steps,
        impact: lvl(x.impact, ["mare", "mediu", "mic"], "mediu") as Recommendation["impact"],
        effort: lvl(x.efort, ["mic", "mediu", "mare"], "mediu") as Recommendation["effort"],
        ...(where ? { link: { href: where, label: "Deschide pagina" } } : {}),
      };
    })
    .filter((r) => r.title && r.steps.length)
    .slice(0, 6);
  const summary = String(o.rezumat ?? "").trim().slice(0, 800);
  // O listă goală e un răspuns valid („nu am nimic solid”), dacă e explicată în rezumat.
  if (!recs.length && (!Array.isArray(o.recomandari) || !summary)) return null;
  return { summary, recommendations: recs };
}

export async function aiRecommendations(data: unknown): Promise<AiOut | { error: string }> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return { error: "Analiza AI nu e activă: lipsește cheia GROQ_API_KEY în Vercel. Recomandările din reguli merg și fără ea." };
  const user = `Datele site-ului (JSON):\n${JSON.stringify(data)}`;
  let lastStatus = 0;
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      let res: Response;
      try {
        res = await fetch(URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model,
            messages: [{ role: "system", content: PROMPT }, { role: "user", content: user }],
            response_format: { type: "json_object" },
            temperature: 0.2,
            max_completion_tokens: 3000,
            reasoning_effort: "low",
          }),
          signal: AbortSignal.timeout(45_000),
        });
      } catch {
        lastStatus = -1;
        continue;
      }
      lastStatus = res.status;
      if (res.ok) {
        const j = (await res.json().catch(() => null)) as { choices?: { message?: { content?: string } }[] } | null;
        const content = j?.choices?.[0]?.message?.content ?? "";
        let parsed: unknown = null;
        try { parsed = JSON.parse(content); } catch { parsed = null; }
        const out = clean(parsed);
        if (out) {
          const { kept, rejected } = groundAiRecommendations(out.recommendations, data);
          return { summary: out.summary, recommendations: kept, rejected, model };
        }
        continue;
      }
      if (res.status === 404 || res.status === 400) break; // model indisponibil pentru cont: următorul
      if (res.status === 401 || res.status === 403) return { error: "Cheia GROQ_API_KEY pare invalidă. Verific-o în Vercel." };
      if (res.status === 429) await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  return { error: lastStatus === 429 ? "AI-ul gratuit a atins limita pe minut. Încearcă din nou peste un minut." : "AI-ul nu a răspuns acum. Recomandările din reguli de mai jos sunt valabile." };
}
