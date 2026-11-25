// Un singur model pentru măsurătorile electrice, oricine le-ar fi introdus:
//  - tehnicianul, în aplicație, prin formularul „Verificare tablou electric” (job_forms, template electric_verificare);
//  - biroul, în pagina Electric (tabela electric_measurements).
// Pagina Electric și totalurile citesc DOAR prin funcțiile de aici, ca să nu mai existe
// „ce măsoară tehnicianul nu apare la birou”.

export type MeasurementSource = "aplicatie" | "birou";
export type ObservationCode = "C1" | "C2" | "C3";
const toCode = (v: unknown): ObservationCode | null => (v === "C1" || v === "C2" || v === "C3" ? v : null);

/** Câte observații din fiecare cod are o lucrare (C1 primul: e pericol). */
export function codeSummary(rows: { code: ObservationCode | null }[]) {
  return { C1: rows.filter((r) => r.code === "C1").length, C2: rows.filter((r) => r.code === "C2").length, C3: rows.filter((r) => r.code === "C3").length };
}

export type UnifiedMeasurement = {
  id: string;
  label: string;
  kind: "tablou" | "circuit";
  insulationMohm: number | null;
  loopOhm: number | null;
  continuityOhm: number | null;
  protection: string | null;
  rcdMs: number | null;
  result: "conform" | "neconform" | null;
  /** Observația codificată pe circuit (model EICR): C1 pericol, C2 potențial periculos, C3 recomandare. */
  code: ObservationCode | null;
  notes: string | null;
  source: MeasurementSource;
  /** Cine a completat formularul în aplicație (doar pentru sursa „aplicatie”). */
  by: string | null;
};

export type OfficeMeasurementRow = {
  id: string;
  label: string;
  kind: string;
  insulation_mohm: number | null;
  loop_ohm: number | null;
  continuity_ohm: number | null;
  result: string | null;
  notes: string | null;
};

export type ElectricFormRow = {
  id: string;
  data: unknown;
  completed_at: string | null;
  by?: string | null;
};

const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const toText = (v: unknown, max = 300): string | null => {
  const s = typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
  return s ? s.slice(0, max) : null;
};
const toResult = (v: unknown): UnifiedMeasurement["result"] => (v === "conform" || v === "neconform" ? v : null);

export function fromOffice(row: OfficeMeasurementRow): UnifiedMeasurement {
  return {
    id: row.id,
    label: row.label,
    kind: row.kind === "tablou" ? "tablou" : "circuit",
    insulationMohm: toNum(row.insulation_mohm),
    loopOhm: toNum(row.loop_ohm),
    continuityOhm: toNum(row.continuity_ohm),
    protection: null,
    rcdMs: null,
    result: toResult(row.result),
    code: null,
    notes: row.notes,
    source: "birou",
    by: null,
  };
}

/**
 * Formularul tehnicianului → rânduri: un rând pentru tablou + câte unul pentru fiecare circuit.
 * Rezultatul stabilit de tehnician e pentru tot tabloul, deci se aplică fiecărui circuit.
 * O ciornă (formular neterminat) nu produce rânduri: încă nu e o măsurătoare asumată.
 */
export function fromElectricForm(form: ElectricFormRow): UnifiedMeasurement[] {
  if (!form.completed_at || !form.data || typeof form.data !== "object") return [];
  const d = form.data as Record<string, unknown>;
  const result = toResult(d.rezultat);
  const by = form.by ?? null;
  const board = toText(d.tablou, 160) ?? "Tablou";
  const boardNotes = [toText(d.producator), toText(d.serie) ? `serie ${toText(d.serie)}` : null, toText(d.observatii, 1000)].filter(Boolean).join(" · ") || null;
  const rows: UnifiedMeasurement[] = [
    {
      id: `${form.id}:tablou`,
      label: board,
      kind: "tablou",
      insulationMohm: null,
      loopOhm: null,
      continuityOhm: null,
      protection: null,
      rcdMs: null,
      result,
      code: null,
      notes: boardNotes,
      source: "aplicatie",
      by,
    },
  ];
  const circuits = Array.isArray(d.circuite) ? (d.circuite as Record<string, unknown>[]) : [];
  circuits.forEach((c, i) => {
    if (!c || typeof c !== "object") return;
    rows.push({
      id: `${form.id}:c${i}`,
      label: toText(c.denumire, 160) ?? `Circuit ${i + 1}`,
      kind: "circuit",
      insulationMohm: toNum(c.izolatie),
      loopOhm: toNum(c.bucla),
      continuityOhm: toNum(c.continuitate_pe),
      protection: toText(c.protectie, 40),
      rcdMs: toNum(c.rcd_ms),
      result,
      code: toCode(c.cod),
      notes: toText(c.constatare, 300),
      source: "aplicatie",
      by,
    });
  });
  return rows;
}

/** Toate măsurătorile unei lucrări: întâi cele din aplicație (în ordinea formularului), apoi cele de la birou. */
export function unifyMeasurements(forms: ElectricFormRow[], office: OfficeMeasurementRow[]): UnifiedMeasurement[] {
  return [...forms.flatMap(fromElectricForm), ...office.map(fromOffice)];
}
