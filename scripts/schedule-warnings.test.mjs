import { test } from "node:test";
import assert from "node:assert/strict";
import { computeScheduleWarnings, spanHours } from "../src/lib/schedule-warnings.ts";

const base = {
  date: "2026-11-26", start: "09:00", end: "13:00", domain: "electric", teamName: "Echipa Electric A",
  people: [{ id: "a", name: "Andrei Pop" }, { id: "b", name: "Sorin Lazăr" }],
  personDocs: [], vehicles: [], leaves: [], otherJobs: [], hoursPerDay: 8, materials: [],
};
const kinds = (w) => w.map((x) => `${x.level}:${x.kind}`);

test("fără probleme, fără avertizări", () => {
  assert.deepEqual(computeScheduleWarnings(base), []);
});

test("autorizație expirată înainte de data lucrării, doar pe domeniul lucrării", () => {
  const w = computeScheduleWarnings({ ...base, personDocs: [
    { profileId: "a", title: "Autorizație ANRE grad IIB", expiresOn: "2026-10-27", domain: "electric" },
    { profileId: "b", title: "Legitimație instalator gaze", expiresOn: "2026-10-01", domain: "gaze" },
    { profileId: "b", title: "Autorizație ANRE grad IIB", expiresOn: "2026-11-26", domain: "electric" },
  ] });
  assert.deepEqual(kinds(w), ["bad:autorizatie"]);
  assert.match(w[0].text, /Andrei Pop: Autorizație ANRE grad IIB a expirat pe 27 oct\./);
});

test("ITP expirat pe mașina echipei", () => {
  const w = computeScheduleWarnings({ ...base, vehicles: [{ label: "CJ 41 DMO", docs: [{ title: "ITP", expiresOn: "2026-11-05" }] }] });
  assert.equal(w[0].text, "Mașina CJ 41 DMO: ITP a expirat pe 5 nov.");
});

test("concediu aprobat în ziua lucrării", () => {
  const w = computeScheduleWarnings({ ...base, leaves: [{ profileId: "b", start: "2026-11-24", end: "2026-11-28", type: "concediu_medical" }, { profileId: "a", start: "2026-11-27", end: "2026-11-28", type: null }] });
  assert.deepEqual(kinds(w), ["bad:concediu"]);
  assert.match(w[0].text, /Sorin Lazăr e în concediu medical/);
});

test("suprapunere de ore pe același om; fără ore devine doar de verificat", () => {
  const w = computeScheduleWarnings({ ...base, otherJobs: [
    { number: 65, title: "Tablou", start: "12:00:00", end: "15:00:00", assigneeIds: ["a"], onTeam: false },
    { number: 66, title: "PRAM", start: "13:00:00", end: "15:00:00", assigneeIds: ["a"], onTeam: false },
    { number: 67, title: "Fără ore", start: null, end: null, assigneeIds: ["b"], onTeam: false },
  ] });
  assert.deepEqual(kinds(w), ["bad:suprapunere", "warn:suprapunere"]);
  assert.match(w[0].text, /Andrei Pop e deja pe #65 Tablou, 12:00–15:00/);
});

test("o singură avertizare pe lucrare, cu toți oamenii", () => {
  const w = computeScheduleWarnings({ ...base, otherJobs: [{ number: 70, title: "Montaj", start: "10:00", end: "12:00", assigneeIds: ["a", "b"], onTeam: true }] });
  assert.deepEqual(kinds(w), ["bad:suprapunere"]);
  assert.match(w[0].text, /Andrei Pop și Sorin Lazăr sunt deja pe #70 Montaj, 10:00–12:00/);
});

test("echipa peste norma zilnică", () => {
  assert.equal(spanHours("09:00", "13:30"), 4.5);
  const w = computeScheduleWarnings({ ...base, people: [], otherJobs: [{ number: 1, title: "x", start: "07:00", end: "12:00", assigneeIds: [], onTeam: true }] });
  assert.deepEqual(kinds(w), ["warn:incarcare"]);
  assert.match(w[0].text, /are deja 5\sh programate pe 26 nov\.; cu lucrarea asta ajunge la 9\sh \(norma: 8\sh\)/);
});

test("material lipsă sau insuficient", () => {
  const w = computeScheduleWarnings({ ...base, materials: [
    { name: "Disjunctor 16A", unit: "buc", needed: 1, available: 0 },
    { name: "Cablu CYY-F 3x2,5", unit: "m", needed: 50, available: 20 },
    { name: "Doză", unit: "buc", needed: 2, available: 10 },
  ] });
  assert.deepEqual(kinds(w), ["warn:material", "warn:material"]);
  assert.match(w[0].text, /nu e în stoc/);
  assert.match(w[1].text, /în stoc 20 m, trebuie 50 m/);
});

test("roșiile primele", () => {
  const w = computeScheduleWarnings({ ...base, materials: [{ name: "X", unit: "buc", needed: 1, available: 0 }], vehicles: [{ label: "B 1", docs: [{ title: "RCA", expiresOn: "2026-01-01" }] }] });
  assert.deepEqual(kinds(w), ["bad:masina", "warn:material"]);
});

test("aparat cu calibrarea expirată la omul lucrării", () => {
  const w = computeScheduleWarnings({
    date: "2026-12-01", start: "08:00", end: "12:00", domain: "electric", teamName: "Echipa A",
    people: [{ id: "p1", name: "Andrei Pop" }, { id: "p2", name: "Mihai" }],
    personDocs: [], vehicles: [], leaves: [], otherJobs: [], hoursPerDay: 8, materials: [],
    devices: [
      { holderId: "p1", name: "Multimetru Fluke 117", expiresOn: "2026-10-30" },
      { holderId: "p2", name: "Megohmmetru", expiresOn: "2027-01-10" },
      { holderId: "p9", name: "Alt aparat", expiresOn: "2020-01-01" },
      { holderId: "p2", name: "Clește", expiresOn: null },
    ],
  });
  const ap = w.filter((x) => x.kind === "aparat");
  assert.equal(ap.length, 2);
  assert.match(ap[0].text, /Multimetru Fluke 117 \(la Andrei Pop\): calibrarea a expirat pe 30 oct\./);
  assert.match(ap[1].text, /fără|nu are dată/);
});
