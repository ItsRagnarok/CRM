/**
 * Importul universului de firme pentru prospectare (tabela ro_firms).
 * Descarcă situațiile financiare publicate de Ministerul Finanțelor pe data.gov.ro (CUI, CAEN, I13 cifra de afaceri,
 * I18/I19 profit/pierdere, I20 angajați) și păstrează doar domeniile cu echipe pe teren și firmele cu cel puțin 10 angajați.
 * Rulează pe server pentru că data.gov.ro nu răspunde serverelor din afara Europei.
 * Protejată de un jeton de unică folosință din private.prospect_import_tokens (verificat în prospect_import_firms).
 *
 * GET /api/prospect-import?token=...&year=2025&file=uu|bl
 */
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const FILES: Record<string, Record<string, string>> = {
  "2025": {
    uu: "https://data.gov.ro/dataset/e2266fdc-0a6b-43b8-9c9f-7a6943d85b28/resource/eeecc692-d914-4d3b-b7f5-d1a8a9791979/download/web_uu_an2025.txt",
    bl: "https://data.gov.ro/dataset/e2266fdc-0a6b-43b8-9c9f-7a6943d85b28/resource/3540a9ce-6a4d-4e29-9aa1-ac909fe28ac1/download/web_bl_bs_sl_an2025.txt",
  },
};
// Construcții și instalații (42, 43), energie (35), reparații și instalare de echipamente (33), inginerie (71),
// securitate (80), facility (81), telecom (61), reparații (95).
const PREFIXES = ["42", "43", "35", "33", "71", "80", "81", "61", "95"];
const MIN_EMPLOYEES = 10;

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const token = p.get("token") ?? "";
  const year = p.get("year") ?? "2025";
  const url = FILES[year]?.[p.get("file") ?? "uu"];
  if (!/^[0-9a-f]{32,64}$/.test(token) || !url) return Response.json({ error: "cerere greșită" }, { status: 400 });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok || !res.body) return Response.json({ error: `data.gov.ro a răspuns ${res.status}` }, { status: 502 });

  const reader = res.body.getReader();
  const dec = new TextDecoder("latin1");
  let rest = "", header: string[] | null = null, lines = 0, kept = 0, saved = 0;
  let batch: Record<string, unknown>[] = [];
  const num = (s: string | undefined) => (s && s.trim() !== "" && Number.isFinite(Number(s)) ? Number(s) : null);
  const flush = async () => {
    if (!batch.length) return;
    const { data, error } = await db.rpc("prospect_import_firms", { p_token: token, p_rows: batch });
    if (error) throw new Error(error.message);
    saved += Number(data ?? 0);
    batch = [];
  };
  const handle = (line: string) => {
    if (!line) return;
    const c = line.split(",");
    if (!header) { header = c.map((h) => h.trim().toUpperCase()); return; }
    lines++;
    const at = (k: string) => c[header!.indexOf(k)];
    const caen = (at("CAEN") ?? "").trim().padStart(4, "0");
    const emp = num(at("I20"));
    if (emp == null || emp < MIN_EMPLOYEES || !PREFIXES.some((x) => caen.startsWith(x))) return;
    const profit = num(at("I18")), loss = num(at("I19"));
    batch.push({ cui: (at("CUI") ?? "").trim(), caen, employees: emp, turnover: num(at("I13")), profit: profit ? profit : loss ? -loss : 0, year: Number(year) });
    kept++;
  };
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      rest += dec.decode(value, { stream: true });
      const parts = rest.split(/\r?\n/);
      rest = parts.pop() ?? "";
      for (const line of parts) handle(line);
      if (batch.length >= 2000) await flush();
    }
    handle(rest);
    await flush();
  } catch (e) {
    return Response.json({ error: String(e).slice(0, 300), lines, kept, saved }, { status: 500 });
  }
  return Response.json({ year, file: p.get("file") ?? "uu", lines, kept, saved });
}
