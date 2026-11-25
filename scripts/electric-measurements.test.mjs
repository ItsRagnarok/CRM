import { test } from "node:test";
import assert from "node:assert/strict";
import { fromElectricForm, unifyMeasurements } from "../src/lib/forms/electric-measurements.ts";

const form = {
  id: "f1",
  completed_at: "2026-11-20T10:00:00Z",
  by: "Radu Munteanu",
  data: {
    tablou: "TG parter",
    producator: "Schneider",
    serie: "A12",
    rezultat: "conform",
    observatii: "fără observații",
    circuite: [
      { denumire: "C1 iluminat", protectie: "B10", izolatie: "550", bucla: "0,42", continuitate_pe: 0.3, rcd_ms: "24" },
      { denumire: "", izolatie: 200 },
    ],
  },
};

test("formularul tehnicianului devine tablou + câte un rând pe circuit", () => {
  const rows = fromElectricForm(form);
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map((r) => r.kind), ["tablou", "circuit", "circuit"]);
  assert.equal(rows[0].label, "TG parter");
  assert.match(rows[0].notes, /Schneider · serie A12 · fără observații/);
  assert.equal(rows[1].label, "C1 iluminat");
  assert.equal(rows[1].insulationMohm, 550);
  assert.equal(rows[1].loopOhm, 0.42, "virgula românească e acceptată");
  assert.equal(rows[1].rcdMs, 24);
  assert.equal(rows[1].protection, "B10");
  assert.equal(rows[2].label, "Circuit 2", "circuit fără nume primește un nume implicit");
  assert.ok(rows.every((r) => r.result === "conform" && r.source === "aplicatie" && r.by === "Radu Munteanu"));
});

test("o ciornă nu apare ca măsurătoare", () => {
  assert.equal(fromElectricForm({ ...form, completed_at: null }).length, 0);
  assert.equal(fromElectricForm({ id: "x", completed_at: "2026-11-20", data: null }).length, 0);
});

test("valori invalide devin goale, nu numere greșite", () => {
  const [, c] = fromElectricForm({ ...form, data: { ...form.data, rezultat: "poate", circuite: [{ denumire: "C", izolatie: "abc" }] } });
  assert.equal(c.insulationMohm, null);
  assert.equal(c.result, null);
});

test("aplicație + birou într-o singură listă", () => {
  const all = unifyMeasurements([form], [{ id: "m1", label: "C9", kind: "circuit", insulation_mohm: 300, loop_ohm: null, continuity_ohm: null, result: "neconform", notes: null }]);
  assert.equal(all.length, 4);
  assert.equal(all[3].source, "birou");
  assert.equal(all[3].result, "neconform");
});

test("observațiile C1/C2/C3 din aplicație ajung la birou, cu constatarea", async () => {
  const { fromElectricForm, codeSummary } = await import("../src/lib/forms/electric-measurements.ts");
  const rows = fromElectricForm({
    id: "f1",
    completed_at: "2026-11-25T10:00:00Z",
    data: { tablou: "TG", rezultat: "neconform", circuite: [{ denumire: "C1 baie", izolatie: "0,4", cod: "C1", constatare: "lipsă PE" }, { denumire: "C2 prize", izolatie: "300", cod: "ok" }, { denumire: "C3", cod: "C3" }] },
  });
  assert.equal(rows[1].code, "C1");
  assert.equal(rows[1].notes, "lipsă PE");
  assert.equal(rows[2].code, null);
  assert.deepEqual(codeSummary(rows), { C1: 1, C2: 0, C3: 1 });
});
