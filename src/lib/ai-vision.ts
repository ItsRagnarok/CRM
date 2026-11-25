import "server-only";
import { parseModelJson } from "@/lib/ai-extract";

export type VisionResult = { ok: true; data: unknown; provider: string; model: string; ms: number } | { ok: false; error: string; provider: string | null; model: string | null; ms: number };

/**
 * Citește o poză cu un model AI și întoarce JSON-ul cerut în prompt.
 * Întâi Google Gemini (citește bine bonuri și plăcuțe), apoi Groq dacă e setat GROQ_VISION_MODEL.
 * Modelele se pot schimba fără cod: GROQ_VISION_MODEL, GEMINI_VISION_MODEL.
 */
export async function readImageJson(image: Blob, prompt: string): Promise<VisionResult> {
  const started = Date.now();
  const mime = image.type && image.type.startsWith("image/") ? image.type : "image/jpeg";
  const b64 = Buffer.from(await image.arrayBuffer()).toString("base64");
  const errors: string[] = [];

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const model = process.env.GEMINI_VISION_MODEL || "gemini-3.8-flash";
    // Citirea unui bon nu cere „gândire” lungă: cerem nivelul mic (mult mai rapid). Dacă modelul nu
    // acceptă setarea, mai încercăm o dată fără ea.
    for (const thinking of [true, false]) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: "POST",
          headers: { "x-goog-api-key": geminiKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: b64 } }] }],
            generationConfig: { temperature: 0, responseMimeType: "application/json", ...(thinking ? { thinkingConfig: { thinkingLevel: "low" } } : {}) },
          }),
          signal: AbortSignal.timeout(45_000),
        });
        if (res.ok) {
          const j = await res.json();
          const text = (j?.candidates?.[0]?.content?.parts ?? []).filter((p: { thought?: boolean }) => !p.thought).map((p: { text?: string }) => p.text ?? "").join("");
          const data = parseModelJson(text);
          if (data) return { ok: true, data, provider: "gemini", model, ms: Date.now() - started };
          errors.push("gemini: răspuns fără JSON");
          break;
        }
        const body = (await res.text().catch(() => "")).slice(0, 300);
        console.error("readImageJson gemini", res.status, body);
        if (thinking && res.status === 400 && /thinking/i.test(body)) continue;
        errors.push(`gemini: ${res.status}`);
        break;
      } catch (e) {
        errors.push("gemini: fără răspuns");
        console.error("readImageJson gemini", e instanceof Error ? e.name : e);
        break;
      }
    }
  }

  // Groq doar dacă firma i-a ales un model de imagine (modelele Groq se schimbă des).
  const groqKey = process.env.GROQ_API_KEY;
  const groqModel = process.env.GROQ_VISION_MODEL;
  if (groqKey && groqModel) {
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
        signal: AbortSignal.timeout(30_000),
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

  if (!geminiKey && !(groqKey && groqModel)) return { ok: false, error: "AI-ul nu e configurat pe server.", provider: null, model: null, ms: 0 };
  return { ok: false, error: errors.join("; ").slice(0, 300), provider: null, model: null, ms: Date.now() - started };
}
