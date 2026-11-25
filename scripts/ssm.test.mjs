import { test } from "node:test";
import assert from "node:assert/strict";
import { addMonths, nextDue, trainingState, isHeightFitness, checkResult, templateFor, TEMPLATES, itmHint } from "../src/lib/ssm.ts";

test("următoarea instruire: 6 luni pe teren, 12 la birou; capătul de lună", () => {
  assert.equal(nextDue("2026-05-10", "technician"), "2026-11-10");
  assert.equal(nextDue("2026-05-10", "manager"), "2027-05-10");
  assert.equal(addMonths("2026-08-31", 6), "2027-02-28");
  assert.equal(addMonths("2027-08-31", 6), "2028-02-29");
});

test("starea instruirii după cea mai recentă", () => {
  assert.equal(trainingState([], "2026-11-25").state, "lipsa");
  const rows = [
    { phase: "periodic", done_on: "2026-01-10", next_due: "2026-07-10", confirmed_at: "x" },
    { phase: "periodic", done_on: "2026-07-01", next_due: "2026-12-10", confirmed_at: null },
  ];
  const s = trainingState(rows, "2026-11-25");
  assert.equal(s.state, "curand");
  assert.equal(s.due, "2026-12-10");
  assert.equal(s.unconfirmed, 1);
  assert.equal(trainingState(rows.slice(0, 1), "2026-11-25").state, "expirat");
});

test("aptitudinea pentru înălțime se recunoaște după titlu", () => {
  assert.ok(isHeightFitness("Fișă aptitudine: apt lucru la înălțime"));
  assert.ok(isHeightFitness("Apt pentru lucru la inaltime"));
  assert.ok(!isHeightFitness("Autorizație ANRE grad IIB"));
});

test("lista de verificare: totul bifat sau ce lipsește", () => {
  assert.equal(templateFor("gaze"), "gaze");
  assert.equal(templateFor(null, true), "fotovoltaic");
  assert.equal(templateFor(null), "general");
  const all = Object.fromEntries(TEMPLATES.electric.items.map((i) => [i.id, true]));
  assert.equal(checkResult("electric", all).allOk, true);
  const r = checkResult("electric", { ...all, verif_tensiune: false });
  assert.equal(r.allOk, false);
  assert.deepEqual(r.missing.map((m) => m.id), ["verif_tensiune"]);
  assert.match(itmHint("accident", true), /24 de ore/);
});

import { computeScheduleWarnings } from "../src/lib/schedule-warnings.ts";
const base = { date: "2026-12-01", start: "08:00", end: "12:00", domain: "fotovoltaic", teamName: "A", people: [{ id: "a", name: "Ana" }, { id: "b", name: "Bogdan" }], personDocs: [], vehicles: [], leaves: [], otherJobs: [], hoursPerDay: 8, materials: [] };

test("avertizări SSM: instruire expirată sau lipsă, doar dacă firma ține evidența", () => {
  const off = computeScheduleWarnings({ ...base, ssm: { tracked: false, people: [] } });
  assert.equal(off.filter((w) => w.kind === "ssm").length, 0);
  const on = computeScheduleWarnings({ ...base, ssm: { tracked: true, people: [{ profileId: "a", due: "2026-11-20" }] } });
  const ssm = on.filter((w) => w.kind === "ssm").map((w) => w.text);
  assert.equal(ssm.length, 2);
  assert.match(ssm.join(" "), /Ana: instruirea SSM periodică a expirat/);
  assert.match(ssm.join(" "), /Bogdan nu are instruire SSM/);
});

test("lucru la înălțime: cine nu are «apt» valabil; documentul expirat nu apare de două ori", () => {
  const w = computeScheduleWarnings({ ...base, atHeight: true, heightOk: ["a"], personDocs: [{ profileId: "b", title: "Apt pentru lucru la înălțime (fișa medicală)", expiresOn: "2026-11-01", domain: null }] });
  const h = w.filter((x) => x.kind === "inaltime");
  assert.equal(h.length, 1);
  assert.match(h[0].text, /Bogdan/);
  assert.equal(w.filter((x) => x.kind === "autorizatie").length, 0);
  assert.equal(computeScheduleWarnings({ ...base, atHeight: false, heightOk: [] }).filter((x) => x.kind === "inaltime").length, 0);
});
