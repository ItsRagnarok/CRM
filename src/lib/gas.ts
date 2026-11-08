import { complianceLevel, daysLabel, daysUntil, type ComplianceLevel } from "@/lib/compliance";

export const CONTACT_STATUSES = [
  { id: "neprogramat", label: "Neprogramat" },
  { id: "programat", label: "Programat" },
  { id: "nu_raspunde", label: "Nu răspunde" },
  { id: "refuz", label: "Refuză" },
  { id: "efectuat", label: "Efectuat" },
] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number]["id"];
export const statusLabel = (id: string) => CONTACT_STATUSES.find((s) => s.id === id)?.label ?? id;

export function addMonths(isoDate: string, months: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + months);
  if (d.getUTCDate() !== day) d.setUTCDate(0); // 31 Jan + 1 month -> end of Feb, not March
  return d.toISOString().slice(0, 10);
}

export type UnitDue = {
  /** Earliest next deadline, or null when no date is known yet. */
  dueOn: string | null;
  kind: "verificare" | "revizie" | null;
  left: number | null;
  level: ComplianceLevel | "unknown";
};

/** Next inspection and next revision are computed independently from their own last dates. */
export function unitDue(
  unit: { last_inspection_on: string | null; last_revision_on: string | null },
  settings: { inspectionMonths: number; revisionMonths: number },
  today: string,
): UnitDue {
  const candidates: { on: string; kind: "verificare" | "revizie" }[] = [];
  if (unit.last_inspection_on) candidates.push({ on: addMonths(unit.last_inspection_on, settings.inspectionMonths), kind: "verificare" });
  if (unit.last_revision_on) candidates.push({ on: addMonths(unit.last_revision_on, settings.revisionMonths), kind: "revizie" });
  if (!candidates.length) return { dueOn: null, kind: null, left: null, level: "unknown" };
  candidates.sort((a, b) => a.on.localeCompare(b.on));
  const left = daysUntil(candidates[0].on, today);
  return { dueOn: candidates[0].on, kind: candidates[0].kind, left, level: complianceLevel(left) };
}

export const dueText = (due: UnitDue) => (due.left === null ? "fără dată" : daysLabel(due.left));

// ---------- import (paste from Excel/CSV) ----------
export type ImportRow = {
  stair: string;
  apartment: string;
  owner_name: string | null;
  phone: string | null;
  last_inspection_on: string | null;
  last_revision_on: string | null;
};

export function parseDate(raw: string): string | null | undefined {
  const v = raw.trim();
  if (!v) return null;
  let y: number, m: number, d: number;
  let match = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) [y, m, d] = [+match[1], +match[2], +match[3]];
  else if ((match = v.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/))) [d, m, y] = [+match[1], +match[2], +match[3]];
  else return undefined;
  const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const t = new Date(`${iso}T00:00:00Z`);
  return t.getUTCFullYear() === y && t.getUTCMonth() + 1 === m && t.getUTCDate() === d && y >= 1990 && y <= 2100 ? iso : undefined;
}

export const MAX_IMPORT_ROWS = 2000;

/** Columns: scară, apartament, nume, telefon, ultima verificare, ultima revizie. Tab, ; or , separated. */
export function parseUnits(text: string): { rows: ImportRow[]; errors: string[] } {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows: ImportRow[] = [];
  const errors: string[] = [];
  if (!lines.length) return { rows, errors: ["Nu ai lipit nimic."] };
  const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  const header = /apartament|ap\.?$|scar/i.test(lines[0].split(sep)[0] + sep + (lines[0].split(sep)[1] ?? "")) && !/\d/.test(lines[0].split(sep)[1] ?? "");
  const body = header ? lines.slice(1) : lines;
  if (body.length > MAX_IMPORT_ROWS) return { rows, errors: [`Maximum ${MAX_IMPORT_ROWS} de apartamente o dată.`] };
  const seen = new Set<string>();
  body.forEach((line, i) => {
    const n = i + 1 + (header ? 1 : 0);
    const c = line.split(sep).map((s) => s.trim().replace(/^"|"$/g, ""));
    const [stair = "", apartment = "", name = "", phone = "", insp = "", rev = ""] = c;
    if (!apartment) return errors.push(`Rândul ${n}: lipsește apartamentul.`);
    if (stair.length > 40 || apartment.length > 40 || name.length > 160 || phone.length > 40) return errors.push(`Rândul ${n}: un câmp e prea lung.`);
    const d1 = parseDate(insp), d2 = parseDate(rev);
    if (d1 === undefined) return errors.push(`Rândul ${n}: data verificării „${insp}” nu e validă (folosește ZZ.LL.AAAA).`);
    if (d2 === undefined) return errors.push(`Rândul ${n}: data reviziei „${rev}” nu e validă (folosește ZZ.LL.AAAA).`);
    const key = `${stair.toLowerCase()}|${apartment.toLowerCase()}`;
    if (seen.has(key)) return errors.push(`Rândul ${n}: apartamentul ${stair ? `${stair}/` : ""}${apartment} apare de două ori.`);
    seen.add(key);
    rows.push({ stair, apartment, owner_name: name || null, phone: phone || null, last_inspection_on: d1, last_revision_on: d2 });
  });
  return { rows, errors };
}
