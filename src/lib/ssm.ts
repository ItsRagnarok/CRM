// SSM pe teren (Etapa 4, punctul 19). Funcții pure, testate în scripts/ssm.test.mjs.
//
// Instruirea periodică: cel mult la 6 luni; 12 luni pentru personalul tehnico-administrativ
// (HG 1425/2006). Fazele și intervalul sunt cele din broșura ITM; textul procedurilor din listele
// de verificare e un model de lucru, de validat cu responsabilul SSM al firmei.

export type Phase = "introductiv" | "loc_munca" | "periodic" | "suplimentar";
export const PHASES: { id: Phase; label: string; hint: string }[] = [
  { id: "introductiv", label: "Introductiv-generală", hint: "Înainte de prima zi de lucru (angajat nou, detașat, temporar)." },
  { id: "loc_munca", label: "La locul de muncă", hint: "După cea introductivă și la schimbarea locului de muncă." },
  { id: "periodic", label: "Periodică", hint: "Cel mult la 6 luni (12 luni pentru birou)." },
  { id: "suplimentar", label: "Suplimentară", hint: "După accident, pauză de peste 30 de zile lucrătoare, riscuri sau proceduri noi." },
];
export const PHASE_LABEL: Record<Phase, string> = Object.fromEntries(PHASES.map((p) => [p.id, p.label])) as Record<Phase, string>;

/** Luni până la următoarea instruire periodică: 12 pentru birou (admin, manager), 6 pentru teren. */
export function periodMonths(role: string | null | undefined) {
  return role === "admin" || role === "manager" ? 12 : 6;
}

/** Data + n luni, păstrând ziua (31 ian. + 1 lună = 28/29 feb.). */
export function addMonths(iso: string, months: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, last));
  return target.toISOString().slice(0, 10);
}

export function nextDue(doneOn: string, role: string | null | undefined) {
  return addMonths(doneOn, periodMonths(role));
}

export type TrainingRow = { phase: string; done_on: string; next_due: string | null; confirmed_at: string | null };
export type SsmState = "lipsa" | "expirat" | "curand" | "la_zi";

/** Starea instruirii unui om la o dată: după cea mai recentă instruire (data următoarei). */
export function trainingState(rows: TrainingRow[], today: string): { state: SsmState; last: TrainingRow | null; due: string | null; days: number | null; unconfirmed: number } {
  const sorted = [...rows].sort((a, b) => b.done_on.localeCompare(a.done_on));
  const last = sorted[0] ?? null;
  const unconfirmed = rows.filter((r) => !r.confirmed_at).length;
  if (!last) return { state: "lipsa", last: null, due: null, days: null, unconfirmed };
  const due = sorted.map((r) => r.next_due).find(Boolean) ?? null;
  if (!due) return { state: "la_zi", last, due: null, days: null, unconfirmed };
  const days = Math.round((Date.parse(`${due}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
  return { state: days < 0 ? "expirat" : days <= 30 ? "curand" : "la_zi", last, due, days, unconfirmed };
}

export const STATE_LABEL: Record<SsmState, string> = { lipsa: "Fără instruire", expirat: "Expirată", curand: "Expiră curând", la_zi: "La zi" };

/** Documentul „apt pentru lucru la înălțime” din Conformitate (după titlu). */
export function isHeightFitness(title: string) {
  return /[iî]n[aă]l[tț]ime/i.test(title);
}

export type CheckItem = { id: string; text: string };
export type Template = "electric" | "gaze" | "fotovoltaic" | "general";

const COMMON: CheckItem[] = [
  { id: "eip", text: "Am echipamentul de protecție complet și în stare bună (cască, mănuși, încălțăminte, ochelari)." },
  { id: "zona", text: "Zona de lucru e delimitată; clientul și alte persoane știu să stea deoparte." },
  { id: "trusa", text: "Știu unde e trusa de prim ajutor și am telefonul încărcat, cu semnal." },
];

export const TEMPLATES: Record<Template, { label: string; items: CheckItem[] }> = {
  electric: {
    label: "Electric",
    items: [
      { id: "separare", text: "Am separat circuitul (am deconectat sursa de alimentare)." },
      { id: "blocare", text: "Am blocat și am pus afiș „Nu conectați, se lucrează”." },
      { id: "verif_tensiune", text: "Am verificat lipsa tensiunii cu un aparat verificat înainte, pe un circuit sub tensiune." },
      { id: "pamant", text: "Am legat la pământ și în scurtcircuit, acolo unde se cere." },
      { id: "aparat", text: "Aparatul de măsură e calibrat (are eticheta la zi)." },
      ...COMMON,
    ],
  },
  gaze: {
    label: "Gaze",
    items: [
      { id: "robinet", text: "Am închis robinetul de gaz al instalației și am anunțat clientul." },
      { id: "ventilare", text: "Încăperea e aerisită; nu există flacără deschisă sau fumat în zonă." },
      { id: "detector", text: "Detectorul de gaz portabil e pornit și verificat." },
      { id: "scule", text: "Am scule care nu fac scântei, acolo unde e nevoie." },
      { id: "etanseitate", text: "Știu cum fac proba de etanșeitate la final." },
      ...COMMON,
    ],
  },
  fotovoltaic: {
    label: "Fotovoltaic",
    items: [
      { id: "ham", text: "Am hamul și punctul de ancorare verificate, pentru lucrul pe acoperiș." },
      { id: "scara", text: "Scara sau schela e stabilă și asigurată." },
      { id: "vreme", text: "Vremea permite lucrul pe acoperiș (fără vânt puternic, gheață, ploaie)." },
      { id: "dc", text: "Știu că panourile produc tensiune la lumină; separatorul DC e deschis înainte de conectări." },
      { id: "obiecte", text: "Zona de sub acoperiș e delimitată (cad obiecte)." },
      ...COMMON,
    ],
  },
  general: { label: "General", items: COMMON },
};

export function templateFor(domain: string | null | undefined, atHeight?: boolean): Template {
  if (domain === "electric" || domain === "gaze" || domain === "fotovoltaic") return domain;
  return atHeight ? "fotovoltaic" : "general";
}

/** Toate punctele bifate? Răspunsurile vin ca { id: true/false }. */
export function checkResult(template: Template, answers: Record<string, unknown>) {
  const items = TEMPLATES[template].items;
  const missing = items.filter((i) => answers[i.id] !== true);
  return { allOk: missing.length === 0, missing };
}

export type IncidentKind = "accident" | "aproape" | "incident_periculos" | "echipament";
export const INCIDENT_KINDS: { id: IncidentKind; label: string; hint: string }[] = [
  { id: "accident", label: "Accident", hint: "Cineva s-a rănit." },
  { id: "aproape", label: "Aproape-accident", hint: "Putea să se întâmple ceva (a alunecat scara, a căzut o sculă)." },
  { id: "incident_periculos", label: "Incident periculos", hint: "Scurgere de gaz, scurtcircuit, foc, explozie, fără răniți." },
  { id: "echipament", label: "Echipament defect", hint: "Scară, ham, sculă sau aparat care nu e sigur." },
];
export const INCIDENT_LABEL: Record<IncidentKind, string> = Object.fromEntries(INCIDENT_KINDS.map((k) => [k.id, k.label])) as Record<IncidentKind, string>;

/** Ce spunem biroului despre raportarea la ITM (informativ; decizia e a responsabilului SSM). */
export function itmHint(kind: string, injured: boolean) {
  if (kind === "accident" && injured) return "Dacă omul nu poate lucra 3 zile sau mai mult, accidentul se comunică la ITM și la asigurător în cel mult 24 de ore. Verificați imediat cu responsabilul SSM.";
  if (kind === "incident_periculos") return "Incidentele periculoase se comunică la ITM și se cercetează. Verificați cu responsabilul SSM.";
  if (kind === "accident") return "Accidentele ușoare (sub 3 zile) se trec în registrul firmei și se cercetează intern.";
  return "Nu se comunică în afara firmei; notați măsura luată, ca să nu se repete.";
}
