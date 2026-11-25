// AI cu confirmare umană (Etapa 4, punctul 20). Funcții pure, testate în scripts/ai-extract.test.mjs.
//
// Modelul citește poza și răspunde în JSON; aici curățăm răspunsul: sume în format românesc, date
// plauzibile, serii fără spații în plus. Ce nu e sigur rămâne gol: omul completează, nu ghicim noi.

export const RECEIPT_PROMPT = `Citești poza unui bon fiscal sau a unei facturi din România.
Răspunde DOAR cu un obiect JSON, fără alt text, cu cheile:
{"furnizor": string|null, "data": "YYYY-MM-DD"|null, "total": number|null, "tva": number|null,
 "articole": [{"denumire": string, "cantitate": number|null, "pret_total": number|null}]}
Reguli: "total" este TOTALUL de plată (nu subtotalul). Sumele în lei, cu punct zecimal. Dacă nu se vede
clar o valoare, pune null. Nu inventa articole. Maxim 30 de articole.`;

export const PLATE_PROMPT = `Citești poza plăcuței de identificare (etichetei) unui echipament: invertor, panou
fotovoltaic, baterie, centrală, contor, aparat de măsură sau tablou electric.
Răspunde DOAR cu un obiect JSON, fără alt text, cu cheile:
{"marca": string|null, "model": string|null, "serie": string|null, "putere": string|null, "tip": string|null}
Reguli: "serie" este numărul de serie (S/N, Serial No., SN), copiat exact, literă cu literă. "model" fără marcă.
"putere" cu unitatea (ex. "10 kW", "450 W", "24 kW"). Dacă nu se vede clar, pune null. Nu ghici.`;

/** „1.234,56” / „1234.56” / „1 234,56 lei” → 1234.56; altfel null. */
export function parseAmount(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) && v > 0 && v < 1_000_000 ? Math.round(v * 100) / 100 : null;
  if (typeof v !== "string") return null;
  let s = v.replace(/[^\d.,-]/g, "");
  if (!s) return null;
  const lastComma = s.lastIndexOf(","), lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = Number(s);
  return Number.isFinite(n) && n > 0 && n < 1_000_000 ? Math.round(n * 100) / 100 : null;
}

/** Data de pe bon: YYYY-MM-DD sau DD.MM.YYYY; doar dacă nu e în viitor și nu e mai veche de un an. */
export function parseDate(v: unknown, today: string): string | null {
  if (typeof v !== "string") return null;
  let iso: string | null = null;
  const a = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  const b = v.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (a) iso = `${a[1]}-${a[2]}-${a[3]}`;
  else if (b) iso = `${b[3].length === 2 ? `20${b[3]}` : b[3]}-${b[2].padStart(2, "0")}-${b[1].padStart(2, "0")}`;
  if (!iso || Number.isNaN(Date.parse(`${iso}T00:00:00Z`))) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  if (d.toISOString().slice(0, 10) !== iso) return null;
  const ageDays = (Date.parse(`${today}T00:00:00Z`) - d.getTime()) / 86_400_000;
  return ageDays >= 0 && ageDays <= 366 ? iso : null;
}

const clean = (v: unknown, max: number) => {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const s = String(v).replace(/\s+/g, " ").trim().slice(0, max);
  return s && !/^(null|n\/a|-|necunoscut)$/i.test(s) ? s : null;
};

export type Receipt = { furnizor: string | null; data: string | null; total: number | null; tva: number | null; articole: { denumire: string; cantitate: number | null; pret_total: number | null }[] };

export function normalizeReceipt(raw: unknown, today: string): Receipt {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const items = Array.isArray(r.articole) ? r.articole : [];
  const total = parseAmount(r.total);
  const tva = parseAmount(r.tva);
  return {
    furnizor: clean(r.furnizor, 120),
    data: parseDate(r.data, today),
    total,
    tva: tva !== null && total !== null && tva >= total ? null : tva,
    articole: items
      .slice(0, 30)
      .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
      .map((x) => ({ denumire: clean(x.denumire, 120) ?? "", cantitate: typeof x.cantitate === "number" && x.cantitate > 0 && x.cantitate < 100000 ? x.cantitate : parseAmount(x.cantitate), pret_total: parseAmount(x.pret_total) }))
      .filter((x) => x.denumire),
  };
}

export type Plate = { marca: string | null; model: string | null; serie: string | null; putere: string | null; tip: string | null };

export function normalizePlate(raw: unknown): Plate {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const serie = clean(r.serie, 60)?.replace(/^(s\/?n|serial(\s*no\.?)?)[:\s]*/i, "").replace(/\s/g, "") || null;
  return { marca: clean(r.marca, 60), model: clean(r.model, 80), serie, putere: clean(r.putere, 30), tip: clean(r.tip, 60) };
}

/** „Huawei SUN2000-10KTL” din marcă + model, fără să repete marca dacă e deja în model. */
export function brandModel(p: Pick<Plate, "marca" | "model">) {
  if (p.marca && p.model && !p.model.toLowerCase().includes(p.marca.toLowerCase())) return `${p.marca} ${p.model}`;
  return p.model ?? p.marca ?? null;
}

/** JSON din răspunsul modelului, chiar dacă e înconjurat de text sau de ```json. */
export function parseModelJson(text: string): unknown {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(t);
  } catch {
    const m = t.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { return JSON.parse(m[0]); } catch { return null; }
  }
}

/** Câte câmpuri propuse de AI a schimbat omul (comparat fără spații și fără litere mari/mici). */
export function countCorrections(suggested: Record<string, unknown>, final: Record<string, unknown>) {
  const norm = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/\s+/g, "").toLowerCase();
    const n = Number(s.replace(",", "."));
    return s !== "" && Number.isFinite(n) ? String(Math.round(n * 100) / 100) : s;
  };
  const keys = Object.keys(suggested).filter((k) => norm(suggested[k]) !== "");
  return { fields: keys.length, corrected: keys.filter((k) => norm(suggested[k]) !== norm(final[k])).length };
}
