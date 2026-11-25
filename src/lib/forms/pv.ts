// Voc așteptat pe un string, corectat cu temperatura: n × Voc_STC × (1 + coef/100 × (T − 25)).
// Doar informativ pentru tehnician: rezultatul îl stabilește el, după fișa tehnică și normativ.
// Fără importuri: testat direct cu node.

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

export type StringCheck = { index: number; expected: number; measured: number; deviationPct: number };

export function expectedStringVoc(data: Record<string, unknown>): StringCheck[] {
  const vocPanel = num(data.panou_voc);
  if (!vocPanel) return [];
  const coef = num(data.panou_coef) ?? -0.28;
  const temp = num(data.temp_celule) ?? 25;
  const rows = Array.isArray(data.stringuri) ? (data.stringuri as Record<string, unknown>[]) : [];
  const out: StringCheck[] = [];
  rows.forEach((r, i) => {
    const n = num(r?.panouri);
    const measured = num(r?.voc);
    if (!n || measured === null) return;
    const expected = n * vocPanel * (1 + (coef / 100) * (temp - 25));
    out.push({ index: i + 1, expected: Math.round(expected * 10) / 10, measured, deviationPct: Math.round(((measured - expected) / expected) * 1000) / 10 });
  });
  return out;
}

/** Seriile din textul lipit sau scanat: una pe rând, fără dubluri și rânduri goale. */
export function parseSerials(text: unknown): string[] {
  if (typeof text !== "string") return [];
  return [...new Set(text.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean))];
}
