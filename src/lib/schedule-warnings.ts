/**
 * Avertizări la programarea unei lucrări. Funcție pură (fără importuri), testată în
 * scripts/schedule-warnings.test.mjs. Datele le adună `loadScheduleWarnings` din
 * schedule-warnings-server.ts.
 *
 * Avertizările nu blochează nimic: biroul decide. „bad” = lucrarea nu ar trebui făcută așa
 * (autorizație sau ITP expirat, om în concediu, om pe două lucrări în același timp);
 * „warn” = de verificat (echipă peste normă, material lipsă din stoc).
 */

export type WarningLevel = "bad" | "warn";
export type ScheduleWarning = {
  level: WarningLevel;
  kind: "autorizatie" | "masina" | "concediu" | "suprapunere" | "incarcare" | "material";
  text: string;
  /** Unde se rezolvă problema (pagina din platformă). */
  href?: string;
};

export type WarningInput = {
  date: string; // YYYY-MM-DD
  start: string | null; // HH:MM
  end: string | null;
  domain: string | null;
  teamName: string | null;
  people: { id: string; name: string }[];
  personDocs: { profileId: string; title: string; expiresOn: string; domain: string | null }[];
  vehicles: { label: string; docs: { title: string; expiresOn: string }[] }[];
  leaves: { profileId: string; start: string; end: string; type: string | null }[];
  /** Alte lucrări în aceeași zi (fără cea editată și fără cele anulate). */
  otherJobs: { number: number; title: string; start: string | null; end: string | null; assigneeIds: string[]; onTeam: boolean }[];
  hoursPerDay: number;
  materials: { name: string; unit: string; needed: number; available: number }[];
};

const MONTHS = ["ian.", "feb.", "mar.", "apr.", "mai", "iun.", "iul.", "aug.", "sept.", "oct.", "nov.", "dec."];
export function shortDate(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}
const toMin = (t: string | null) => (t && /^\d{2}:\d{2}/.test(t) ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) : null);
const hhmm = (t: string | null) => (t ? t.slice(0, 5) : "");
export function spanHours(start: string | null, end: string | null) {
  const a = toMin(start), b = toMin(end);
  return a !== null && b !== null && b > a ? (b - a) / 60 : 0;
}
/** Încheie propoziția cu punct, fără „nov..” când luna e deja prescurtată cu punct. */
const dot = (s: string) => (s.endsWith(".") ? s : `${s}.`);
const fmtH = (h: number) => `${Math.round(h * 10) / 10}`.replace(".", ",") + "\u00a0h";

export function computeScheduleWarnings(input: WarningInput): ScheduleWarning[] {
  const out: ScheduleWarning[] = [];
  const { date } = input;
  const name = new Map(input.people.map((p) => [p.id, p.name]));

  // 1. Autorizații / legitimații expirate la data lucrării (pe domeniul lucrării, dacă e ales).
  for (const d of input.personDocs) {
    if (!name.has(d.profileId) || d.expiresOn >= date) continue;
    if (input.domain && d.domain && d.domain !== input.domain) continue;
    out.push({ level: "bad", kind: "autorizatie", text: dot(`${name.get(d.profileId)}: ${d.title} a expirat pe ${shortDate(d.expiresOn)}`), href: "/conformitate" });
  }

  // 2. Mașina echipei: ITP, RCA, rovinietă expirate la data lucrării.
  for (const v of input.vehicles) {
    for (const d of v.docs) {
      if (d.expiresOn < date) out.push({ level: "bad", kind: "masina", text: dot(`Mașina ${v.label}: ${d.title} a expirat pe ${shortDate(d.expiresOn)}`), href: "/conformitate" });
    }
  }

  // 3. Concediu aprobat în ziua lucrării.
  for (const l of input.leaves) {
    if (!name.has(l.profileId) || l.start > date || l.end < date) continue;
    const what = l.type === "concediu_medical" ? "în concediu medical" : l.type === "invoire" ? "învoit" : "în concediu";
    out.push({ level: "bad", kind: "concediu", text: dot(`${name.get(l.profileId)} e ${what} pe ${shortDate(date)}`), href: "/pontaj/concedii" });
  }

  // 4. Același om pe altă lucrare în același interval (sau în aceeași zi, dacă lipsesc orele).
  const myStart = toMin(input.start), myEnd = toMin(input.end);
  // O singură avertizare pe lucrare, cu toți oamenii care se suprapun (nu câte una pe om).
  for (const j of input.otherJobs) {
    const who = input.people.filter((p) => j.assigneeIds.includes(p.id)).map((p) => p.name);
    if (!who.length) continue;
    const s = toMin(j.start), e = toMin(j.end);
    const known = myStart !== null && myEnd !== null && s !== null && e !== null;
    if (known && !(myStart! < e! && s! < myEnd!)) continue;
    const when = j.start && j.end ? `${hhmm(j.start)}–${hhmm(j.end)}` : "fără ore stabilite";
    const names = who.length === 1 ? who[0] : `${who.slice(0, -1).join(", ")} și ${who[who.length - 1]}`;
    const verb = who.length === 1 ? "e" : "sunt";
    out.push({
      level: known ? "bad" : "warn",
      kind: "suprapunere",
      text: known
        ? `${names} ${verb} deja pe #${j.number} ${j.title}, ${when}.`
        : `${names} ${who.length === 1 ? "mai are" : "mai au"} în aceeași zi #${j.number} ${j.title} (${when}). Verifică orele.`,
    });
  }

  // 5. Echipa peste norma zilnică.
  if (input.teamName && input.hoursPerDay > 0) {
    const mine = spanHours(input.start, input.end);
    const already = input.otherJobs.filter((j) => j.onTeam).reduce((a, j) => a + spanHours(j.start, j.end), 0);
    if (mine + already > input.hoursPerDay) {
      out.push({
        level: "warn",
        kind: "incarcare",
        text: `${input.teamName} are deja ${fmtH(already)} programate pe ${shortDate(date)}; cu lucrarea asta ajunge la ${fmtH(already + mine)} (norma: ${fmtH(input.hoursPerDay)}).`,
        href: `/calendar?date=${date}`,
      });
    }
  }

  // 6. Material cerut care nu e în stoc (depozit + mașina echipei).
  for (const m of input.materials) {
    if (m.available >= m.needed) continue;
    out.push({
      level: "warn",
      kind: "material",
      text: m.available > 0
        ? `${m.name}: în stoc ${m.available} ${m.unit}, trebuie ${m.needed} ${m.unit}.`
        : `${m.name}: nu e în stoc (nici în depozit, nici pe mașina echipei).`,
      href: "/materiale",
    });
  }

  return out.sort((a, b) => (a.level === b.level ? 0 : a.level === "bad" ? -1 : 1));
}
