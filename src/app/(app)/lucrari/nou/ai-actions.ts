"use server";

import { requireSessionContext } from "@/lib/auth";

export type AiJobSuggestion = {
  materials: { name: string; quantity: number; unit: string }[];
  tools: string[];
  instructions: string;
  photos: { before: string; during: string; after: string };
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

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const prompt = `Ești un asistent pentru o platformă de management pentru companii românești de electricieni, CCTV, securitate și HVAC. Pe baza informațiilor de mai jos despre o lucrare, generează sugestii utile pentru tehnicianul care o va efectua.

Tip lucrare: ${jobType || "nespecificat"}
Client: ${clientName || "nespecificat"}
Descriere lucrare: ${description || "nespecificată"}

Răspunde DOAR cu JSON valid (fără text suplimentar, fără markdown), exact în acest format:
{"materials":[{"name":"nume material","quantity":1,"unit":"buc"}],"tools":["nume sculă"],"instructions":"instrucțiuni pas cu pas pentru tehnician, în română, concise","photos":{"before":"ce poze trebuie făcute înainte de a începe și ce trebuie să se vadă în ele","during":"ce poze trebuie făcute în timpul lucrării","after":"ce poze trebuie făcute la final, ca dovadă a lucrării"}}`;

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

  if (!Array.isArray(parsed.materials) || !Array.isArray(parsed.tools) || typeof parsed.instructions !== "string") {
    return { error: "Răspunsul AI a fost într-un format neașteptat. Încearcă din nou." };
  }

  return { suggestion: parsed };
}
