import "server-only";
import { parseModelJson } from "@/lib/ai-extract";

export type VisionResult = { ok: true; data: unknown; provider: string; model: string; ms: number } | { ok: false; error: string; provider: string | null; model: string | null; ms: number };

type Hit = { data: unknown; provider: string; model: string };

/**
 * Citește o poză cu un model AI și întoarce JSON-ul cerut în prompt.
 * Trimite poza în paralel la mai mulți furnizori (Gemini, Gemini Lite, Groq) și păstrează primul răspuns
 * valid: când Google e supraîncărcat (503 „high demand” sau fără răspuns), altul răspunde în câteva secunde.
 * Modelele se pot schimba fără cod: GEMINI_VISION_MODEL, GEMINI_VISION_FALLBACK (listă cu virgulă), GROQ_VISION_MODEL.
 */
export async function readImageJson(image: Blob, prompt: string): Promise<VisionResult> {
  const started = Date.now();
  const mime = image.type && image.type.startsWith("image/") ? image.type : "image/jpeg";
  const b64 = Buffer.from(await image.arrayBuffer()).toString("base64");
  const errors: string[] = [];
  // Telefonul așteaptă: după ~45 s omul completează mai repede de mână.
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), 45_000);

  const gemini = async (model: string): Promise<Hit | null> => {
    const key = process.env.GEMINI_API_KEY!;
    // Citirea unui bon nu cere „gândire” lungă: nivelul mic e mult mai rapid. Dacă modelul nu acceptă setarea, fără ea.
    for (const thinking of [true, false]) {
      // Supraîncărcat: încă o încercare după o pauză scurtă.
      for (let attempt = 0; attempt < 2; attempt++) {
        if (stop.signal.aborted) return null;
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
            method: "POST",
            headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: b64 } }] }],
              generationConfig: { temperature: 0, responseMimeType: "application/json", ...(thinking ? { thinkingConfig: { thinkingLevel: "low" } } : {}) },
            }),
            signal: stop.signal,
          });
          if (res.ok) {
            const j = await res.json();
            const text = (j?.candidates?.[0]?.content?.parts ?? []).filter((p: { thought?: boolean }) => !p.thought).map((p: { text?: string }) => p.text ?? "").join("");
            const data = parseModelJson(text);
            if (data) return { data, provider: "gemini", model };
            errors.push(`${model}: răspuns fără JSON`);
            return null;
          }
          const body = (await res.text().catch(() => "")).slice(0, 300);
          console.error("readImageJson gemini", model, res.status, body);
          if (thinking && res.status === 400 && /thinking/i.test(body)) break; // încearcă fără „thinking”
          if ((res.status === 503 || res.status === 429 || res.status === 500) && attempt === 0) {
            await new Promise((r) => setTimeout(r, 2_000));
            continue;
          }
          errors.push(`${model}: ${res.status}`);
          return null;
        } catch (e) {
          if (!stop.signal.aborted) errors.push(`${model}: fără răspuns`);
          console.error("readImageJson gemini", model, e instanceof Error ? e.name : e);
          return null;
        }
      }
      if (!thinking) break;
    }
    return null;
  };

  const groq = async (model: string): Promise<Hit | null> => {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          temperature: 0,
          max_completion_tokens: 1500,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } }] }],
        }),
        signal: stop.signal,
      });
      if (res.ok) {
        const j = await res.json();
        const data = parseModelJson(String(j?.choices?.[0]?.message?.content ?? ""));
        if (data) return { data, provider: "groq", model };
        errors.push(`groq ${model}: răspuns fără JSON`);
        return null;
      }
      errors.push(`groq ${model}: ${res.status}`);
      console.error("readImageJson groq", model, res.status, (await res.text().catch(() => "")).slice(0, 300));
      return null;
    } catch (e) {
      if (!stop.signal.aborted) errors.push(`groq ${model}: fără răspuns`);
      console.error("readImageJson groq", model, e instanceof Error ? e.name : e);
      return null;
    }
  };

  const racers: Promise<Hit | null>[] = [];
  if (process.env.GEMINI_API_KEY) {
    const models = [...new Set([process.env.GEMINI_VISION_MODEL || "gemini-3.8-flash", ...(process.env.GEMINI_VISION_FALLBACK || "gemini-flash-lite-latest").split(",").map((m) => m.trim()).filter(Boolean)])];
    racers.push(...models.map(gemini));
  }
  if (process.env.GROQ_API_KEY) racers.push(groq(process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct"));
  if (!racers.length) {
    clearTimeout(timer);
    return { ok: false, error: "AI-ul nu e configurat pe server.", provider: null, model: null, ms: 0 };
  }

  // Primul răspuns valid câștigă; celelalte cereri se opresc.
  const hit = await new Promise<Hit | null>((resolve) => {
    let pending = racers.length;
    for (const r of racers) {
      r.then((h) => {
        if (h) resolve(h);
        else if (--pending === 0) resolve(null);
      }, () => { if (--pending === 0) resolve(null); });
    }
    stop.signal.addEventListener("abort", () => resolve(null), { once: true });
  });
  clearTimeout(timer);
  stop.abort();
  if (hit) return { ok: true, data: hit.data, provider: hit.provider, model: hit.model, ms: Date.now() - started };
  return { ok: false, error: (errors.join("; ") || "fără răspuns în 45 s").slice(0, 300), provider: null, model: null, ms: Date.now() - started };
}
