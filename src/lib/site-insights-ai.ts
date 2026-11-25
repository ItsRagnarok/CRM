import "server-only";
import type { Recommendation } from "./site-insights";

// Recomandări de la AI (Groq, plan gratuit; aceeași cheie GROQ_API_KEY ca la completarea lucrărilor).
// Primește doar cifre agregate, fără IP sau ceva care să identifice o persoană.

const URL = "https://api.groq.com/openai/v1/chat/completions";
const MODELS = process.env.GROQ_MODEL ? [process.env.GROQ_MODEL] : ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "llama-3.1-8b-instant"];

const PROMPT = `Ești consultant de marketing și vânzări B2B pentru un produs software românesc. Analizezi traficul site-ului și dai recomandări pe care patronul le poate aplica imediat.

Produsul: ElectroField (www.electrofield.ro), platformă pentru firme de instalații din România (electric, fotovoltaic, gaze, HVAC, mentenanță): programarea echipelor, aplicație pe telefon pentru tehnicieni, poze, pontaj, rapoarte, conformitate, facturare.
Obiectivul site-ului: cât mai mulți clienți reali (patroni sau manageri de firme de instalații) care cer o discuție/demonstrație pe pagina /programare.
Canale folosite acum: mesaje directe către firme cu un link marcat (?utm_source=numele-firmei), blog cu articole pentru instalatori, Google.
„Direct” = a scris adresa sau a deschis un link fără sursă. Vizitele proprietarului sunt excluse.

Reguli:
- Folosește DOAR cifrele primite. Citează cifrele concrete în „de_ce”. Nu inventa date, procente sau surse.
- Dacă datele sunt puține, spune asta în rezumat și dă recomandări potrivite pentru puțin trafic (aducerea de trafic calificat), nu optimizări fine.
- Recomandări concrete, cu pași care se pot face azi sau săptămâna asta. Fără sfaturi generale („îmbunătățiți SEO”).
- Scrie în română, cu diacritice, propoziții scurte, la persoana a II-a singular („fă”, „pune”).
- 3–6 recomandări, ordonate după impact asupra numărului de programări.
- „unde”: calea paginii de pe site la care se referă (ex. "/programare", "/", "/blog/..."), sau "" dacă nu e o pagină.

Răspunde DOAR cu JSON valid, fără alt text:
{"rezumat":"2–3 propoziții: ce s-a întâmplat în perioadă și care e cea mai mare problemă","recomandari":[{"titlu":"scurt","de_ce":"ce arată cifrele","ce_faci":["pas 1","pas 2"],"impact":"mare|mediu|mic","efort":"mic|mediu|mare","unde":"/programare"}]}`;

type AiOut = { summary: string; recommendations: Recommendation[]; model: string };

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
  if (!recs.length) return null;
  return { summary: String(o.rezumat ?? "").trim().slice(0, 800), recommendations: recs };
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
            temperature: 0.3,
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
        if (out) return { ...out, model };
        continue;
      }
      if (res.status === 404 || res.status === 400) break; // model indisponibil pentru cont: următorul
      if (res.status === 401 || res.status === 403) return { error: "Cheia GROQ_API_KEY pare invalidă. Verific-o în Vercel." };
      if (res.status === 429) await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  return { error: lastStatus === 429 ? "AI-ul gratuit a atins limita pe minut. Încearcă din nou peste un minut." : "AI-ul nu a răspuns acum. Recomandările din reguli de mai jos sunt valabile." };
}
