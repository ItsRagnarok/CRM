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

// Uses Gemini's free tier (aistudio.google.com/apikey — no billing required)
// rather than Vercel's AI Gateway, which draws from paid team credits. Fails
// closed with a clear message when the key isn't configured yet, instead of
// silently doing nothing.
export async function generateJobSuggestion(
  _prevState: AiJobSuggestionState | undefined,
  formData: FormData
): Promise<AiJobSuggestionState> {
  await requireSessionContext();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      error:
        "Completarea cu AI nu e activată încă — adaugă o cheie GEMINI_API_KEY (gratuită, de la aistudio.google.com/apikey) în variabilele de mediu din Vercel, apoi redeploy.",
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

  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const prompt = `Ești un asistent pentru o platformă de management pentru companii românești de electricieni, CCTV, securitate și HVAC. Pe baza informațiilor de mai jos despre o lucrare, completează automat toate detaliile necesare tehnicianului și administratorului.

Tip lucrare (sugestie inițială, poți corecta): ${jobType || "nespecificat"}
Client: ${clientName || "nespecificat"}
Descriere lucrare: ${description || "nespecificată"}

Valori permise pentru "jobType" (alege EXACT una): ${jobTypeKeys.join(", ")}
Valori permise pentru "priority" (alege EXACT una, în funcție de urgența descrisă): ${priorityKeys.join(", ")}

Răspunde DOAR cu JSON valid (fără text suplimentar, fără markdown), exact în acest format:
{"title":"titlu scurt și clar al lucrării","jobType":"una din valorile permise","priority":"una din valorile permise","steps":["pas 1","pas 2","..."],"materials":[{"name":"nume material","quantity":1,"unit":"buc"}],"tools":["nume sculă"],"instructions":"instrucțiuni detaliate pentru tehnician, în română","photos":{"before":"ce poze trebuie făcute înainte de a începe și ce trebuie să se vadă în ele","during":"ce poze trebuie făcute în timpul lucrării","after":"ce poze trebuie făcute la final, ca dovadă a lucrării"},"estimatedHoursTwoPeople":2.5}

"steps" este o listă scurtă de pași concreți (checklist), separată de "instructions" care e textul detaliat. "estimatedHoursTwoPeople" este o estimare realistă în ore (poate fi zecimală) a duratei lucrării presupunând o echipă de 2 persoane.`;

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
        }),
      }
    );
  } catch (err) {
    console.error("generateJobSuggestion: fetch failed", err);
    return { error: "Nu am putut contacta serviciul AI. Verifică conexiunea și încearcă din nou." };
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("generateJobSuggestion: Gemini error", res.status, errText);
    return {
      error:
        res.status === 400 || res.status === 403
          ? "Cheia GEMINI_API_KEY pare invalidă sau fără permisiuni. Verific-o în Vercel."
          : res.status === 503
            ? "Serviciul AI e supraîncărcat momentan. Mai încearcă o dată în câteva secunde."
            : `AI a răspuns cu o eroare (${res.status}). Încearcă din nou.`,
    };
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
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
