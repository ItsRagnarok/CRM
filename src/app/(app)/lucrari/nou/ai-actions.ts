"use server";

import { requireSessionContext } from "@/lib/auth";
import { JOB_TYPE_LABELS, JOB_PRIORITY_LABELS } from "@/lib/status";

export type AiJobSuggestion = {
  title: string;
  jobType: string;
  priority: string;
  steps: string[];
  materials: { name: string; quantity: number; unit: string }[];
  tools: string[];
  instructions: string;
  photos: { before: string; during: string; after: string };
  estimatedHoursTwoPeople: number;
};

export type AiJobSuggestionState = { error?: string; suggestion?: AiJobSuggestion };

// Uses Groq's free tier (console.groq.com/keys — no billing required) rather
// than Gemini (too often 503 "overloaded" on its free flash tier) or
// Vercel's AI Gateway, which draws from paid team credits. Groq runs on its
// own dedicated inference hardware, so the free tier is rate-limited but
// rarely overloaded. Fails closed with a clear message when the key isn't
// configured yet, instead of silently doing nothing.
export async function generateJobSuggestion(
  _prevState: AiJobSuggestionState | undefined,
  formData: FormData
): Promise<AiJobSuggestionState> {
  await requireSessionContext();

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      error:
        "Completarea cu AI nu e activată încă — adaugă o cheie GROQ_API_KEY (gratuită, de la console.groq.com/keys) în variabilele de mediu din Vercel, apoi redeploy.",
    };
  }

  const description = String(formData.get("aiDescription") ?? "").trim();
  const jobType = String(formData.get("aiJobType") ?? "").trim();
  const clientName = String(formData.get("aiClientName") ?? "").trim();

  if (!description && !jobType) {
    return { error: "Descrie pe scurt lucrarea sau alege întâi un tip de lucrare." };
  }

  const jobTypeKeys = Object.keys(JOB_TYPE_LABELS);
  const priorityKeys = Object.keys(JOB_PRIORITY_LABELS);

  // Groq's model catalog varies by account/plan in ways that aren't
  // reliably documented — a model name that works for one key 404s
  // ("model_not_found") for another. Rather than hardcode a single guess,
  // try a short list of widely-available candidates in order and move on
  // to the next one specifically on a 404, so this keeps working even if
  // a given account doesn't have access to the first pick.
  const candidateModels = process.env.GROQ_MODEL
    ? [process.env.GROQ_MODEL]
    : ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "openai/gpt-oss-120b", "openai/gpt-oss-20b"];
  const prompt = `Ești un electrician autorizat (ANRE, gradele IIB/IIIB) cu peste 15 ani de experiență în instalații electrice, CCTV, securitate și HVAC în România, care scrie acum fișa tehnică de execuție pentru un coleg tehnician care va face lucrarea pe teren. Nu ești un asistent generalist — scrii ca un profesionist din domeniu, pentru un profesionist din domeniu.

Tip lucrare (sugestie inițială, poți corecta): ${jobType || "nespecificat"}
Client: ${clientName || "nespecificat"}
Descriere lucrare: ${description || "nespecificată"}

Cerințe stricte pentru "steps" (procedura pas-cu-pas):
- Fiecare pas trebuie să fie tehnic concret și verificabil: secțiuni de cablu (mmp), valori disjunctoare/siguranțe (A), tip și calibru echipament, unde e relevant — nu generalități de genul "lucrați cu atenție" sau "respectați normele" fără să spui EXACT ce norme și ce înseamnă asta operațional.
- Respectă ordinea obligatorie pentru orice lucrare cu risc electric: 1) întreruperea și blocarea alimentării la sursă, 2) verificarea absenței tensiunii cu aparat de măsură (nu presupunere), 3) echipament individual de protecție (mănuși electroizolante, ochelari, dacă e cazul), 4) execuția tehnică propriu-zisă, cu pași expliciți, 5) verificări finale (continuitate, izolație, împământare, strângere mecanică a bornelor), 6) repunerea sub tensiune și testarea funcțională.
- Referă-te la normativele românești relevante (ex: I7-2011 pentru instalații electrice, PE 101/102 unde e cazul) când e relevant pentru tipul de lucrare — fără să inventezi articole sau numere exacte pe care nu le știi cu certitudine; dacă nu ești sigur de un detaliu normativ exact, spune procedura corectă fără să citezi un articol inventat.
- Un pas per acțiune reală, nu propoziții-umbrelă care ascund mai mulți pași într-una singură.

Valori permise pentru "jobType" (alege EXACT una): ${jobTypeKeys.join(", ")}
Valori permise pentru "priority" (alege EXACT una, în funcție de urgența descrisă): ${priorityKeys.join(", ")}

Răspunde DOAR cu JSON valid (fără text suplimentar, fără markdown), exact în acest format:
{"title":"titlu scurt și clar al lucrării","jobType":"una din valorile permise","priority":"una din valorile permise","steps":["pas 1","pas 2","..."],"materials":[{"name":"nume material","quantity":1,"unit":"buc"}],"tools":["nume sculă"],"instructions":"1-2 propoziții scurte de context general (nu pași numerotați)","photos":{"before":"ce poze trebuie făcute înainte de a începe și ce trebuie să se vadă în ele","during":"ce poze trebuie făcute în timpul lucrării","after":"ce poze trebuie făcute la final, ca dovadă a lucrării"},"estimatedHoursTwoPeople":2.5}

"instructions" este DOAR un scurt context general (1-2 propoziții, fără numerotare) — toată procedura pas-cu-pas, tehnică și precisă, trebuie să fie în "steps". "estimatedHoursTwoPeople" este o estimare realistă în ore (poate fi zecimală) a duratei lucrării presupunând o echipă de 2 persoane.`;

  const url = "https://api.groq.com/openai/v1/chat/completions";

  let res: Response | null = null;
  let lastErrText = "";
  for (const candidateModel of candidateModels) {
    const body = JSON.stringify({
      model: candidateModel,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    // Groq's free tier is rarely "overloaded" (dedicated inference hardware),
    // but can return 429 when the per-minute rate limit is briefly hit —
    // retry a couple of times with backoff before giving up on this model.
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body,
        });
      } catch (err) {
        console.error(`generateJobSuggestion: fetch failed (${candidateModel}, attempt ${attempt})`, err);
        if (attempt === maxAttempts) {
          return { error: "Nu am putut contacta serviciul AI. Verifică conexiunea și încearcă din nou." };
        }
        await new Promise((r) => setTimeout(r, attempt * 1200));
        continue;
      }

      if (res.ok) break;

      lastErrText = await res.text().catch(() => "");
      console.error(`generateJobSuggestion: Groq error (${candidateModel}, attempt ${attempt})`, res.status, lastErrText);
      if ((res.status !== 429 && res.status !== 503) || attempt === maxAttempts) break;
      await new Promise((r) => setTimeout(r, attempt * 1200));
    }

    if (res?.ok) break;
    // A model this account can't use — try the next candidate instead of
    // giving up outright.
    if (res?.status !== 404) break;
  }

  if (!res || !res.ok) {
    const status = res?.status;
    return {
      error:
        status === 401 || status === 403
          ? "Cheia GROQ_API_KEY pare invalidă sau fără permisiuni. Verific-o în Vercel."
          : status === 429
            ? "Serviciul AI a atins limita de cereri momentan (am reîncercat de 3 ori). Mai încearcă peste un minut."
            : status === 404
              ? "Niciunul dintre modelele AI încercate nu e disponibil pe acest cont Groq. Verifică în consola Groq ce model ai acces și setează-l manual în GROQ_MODEL."
              : `AI a răspuns cu o eroare (${status ?? "necunoscută"}). Încearcă din nou.`,
    };
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) return { error: "AI nu a returnat niciun răspuns. Încearcă din nou." };

  let parsed: AiJobSuggestion;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "Răspunsul AI nu a putut fi interpretat. Încearcă din nou." };
  }

  if (
    typeof parsed.title !== "string" ||
    !Array.isArray(parsed.materials) ||
    !Array.isArray(parsed.tools) ||
    !Array.isArray(parsed.steps) ||
    typeof parsed.instructions !== "string"
  ) {
    return { error: "Răspunsul AI a fost într-un format neașteptat. Încearcă din nou." };
  }

  // Never trust the model to stay inside the enum even when told to — fall
  // back to a safe default rather than letting an invalid value reach the
  // form/DB.
  if (!jobTypeKeys.includes(parsed.jobType)) parsed.jobType = jobType || "interventie";
  if (!priorityKeys.includes(parsed.priority)) parsed.priority = "normala";
  if (!Number.isFinite(parsed.estimatedHoursTwoPeople) || parsed.estimatedHoursTwoPeople <= 0) {
    parsed.estimatedHoursTwoPeople = 2;
  }

  return { suggestion: parsed };
}
