import "server-only";
import { parseModelJson } from "@/lib/ai-extract";

export type VisionResult = { ok: true; data: unknown; provider: string; model: string; ms: number } | { ok: false; error: string; provider: string | null; model: string | null; ms: number };

/**
 * Citește o poză cu un model AI și întoarce JSON-ul cerut în prompt.
 * Întâi Google Gemini (citește bine bonuri și plăcuțe), cu reîncercare și modele de rezervă când e supraîncărcat,
 * apoi Groq. Modelele se pot schimba fără cod: GEMINI_VISION_MODEL, GEMINI_VISION_FALLBACK (listă cu virgulă), GROQ_VISION_MODEL.
 */
export async function readImageJson(image: Blob, prompt: string): Promise<VisionResult> {
  const started = Date.now();
  const mime = image.type && image.type.startsWith("image/") ? image.type : "image/jpeg";
  const b64 = Buffer.from(await image.arrayBuffer()).toString("base64");
  const errors: string[] = [];

  // Buget total: telefonul așteaptă; după ~50 s omul completează mai repede de mână.
  const deadline = started + 50_000;
  const left = () => deadline - Date.now();

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    // Modelul principal, apoi rezerve: când Google e supraîncărcat (503/429), alt model răspunde de obicei.
    const models = [...new Set([process.env.GEMINI_VISION_MODEL || "gemini-3.8-flash", ...(process.env.GEMINI_VISION_FALLBACK || "gemini-flash-latest,gemini-flash-lite-latest").split(",").map((m) => m.trim()).filter(Boolean)])];
    outer: for (const model of models) {
      // Citirea unui bon nu cere „gândire” lungă: nivelul mic e mult mai rapid. Dacă modelul nu acceptă setarea, fără ea.
      let thinking = true;
      for (let attempt = 0; attempt < 2 && left() > 4_000; attempt++) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
            method: "POST",
            headers: { "x-goog-api-key": geminiKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: b64 } }] }],
              generationConfig: { temperature: 0, responseMimeType: "application/json", ...(thinking ? { thinkingConfig: { thinkingLevel: "low" } } : {}) },
            }),
            signal: AbortSignal.timeout(Math.min(30_000, left())),
          });
          if (res.ok) {
            const j = await res.json();
            const text = (j?.candidates?.[0]?.content?.parts ?? []).filter((p: { thought?: boolean }) => !p.thought).map((p: { text?: string }) => p.text ?? "").join("");
            const data = parseModelJson(text);
            if (data) return { ok: true, data, provider: "gemini", model, ms: Date.now() - started };
            errors.push(`${model}: răspuns fără JSON`);
            continue outer;
          }
          const body = (await res.text().catch(() => "")).slice(0, 300);
          console.error("readImageJson gemini", model, res.status, body);
          if (thinking && res.status === 400 && /thinking/i.test(body)) { thinking = false; attempt--; continue; }
          errors.push(`${model}: ${res.status}`);
          // Supraîncărcat / limită: o pauză scurtă și încă o dată, apoi modelul următor. 404 = modelul nu există: următorul.
          if ((res.status === 503 || res.status === 429 || res.status === 500) && attempt === 0) { await new Promise((r) => setTimeout(r, 1_500)); continue; }
          continue outer;
        } catch (e) {
          errors.push(`${model}: fără răspuns`);
          console.error("readImageJson gemini", model, e instanceof Error ? e.name : e);
          continue outer;
        }
      }
    }
  }

  // Groq, ultima rezervă (modelul de imagine se poate schimba din GROQ_VISION_MODEL).
  const groqKey = process.env.GROQ_API_KEY;
  const groqModel = process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
  if (groqKey && groqModel && left() > 4_000) {
    const model = groqModel;
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          temperature: 0,
          max_completion_tokens: 1500,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } }] }],
        }),
        signal: AbortSignal.timeout(Math.min(30_000, left())),
      });
      if (res.ok) {
        const j = await res.json();
        const data = parseModelJson(String(j?.choices?.[0]?.message?.content ?? ""));
        if (data) return { ok: true, data, provider: "groq", model, ms: Date.now() - started };
        errors.push("groq: răspuns fără JSON");
      } else {
        errors.push(`groq: ${res.status}`);
        console.error("readImageJson groq", res.status, (await res.text().catch(() => "")).slice(0, 300));
      }
    } catch (e) {
      errors.push("groq: fără răspuns");
      console.error("readImageJson groq", e);
    }
  }

  if (!geminiKey && !groqKey) return { ok: false, error: "AI-ul nu e configurat pe server.", provider: null, model: null, ms: 0 };
  return { ok: false, error: errors.join("; ").slice(0, 300), provider: null, model: null, ms: Date.now() - started };
}
