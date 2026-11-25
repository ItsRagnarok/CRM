import { test } from "node:test";
import assert from "node:assert/strict";
import { addWorkingDays, gasRecordDeadlines, isWorkingDay, orthodoxEaster, workingDaysLeft } from "../src/lib/working-days.ts";
import { GAS_TEMPLATES, REVIZIE_OPS, VERIFICARE_OPS, summarizeGasRecord } from "../src/lib/forms/gas-record.ts";
import { missingRequired } from "../src/lib/forms/templates.ts";

test("Paștele ortodox și sărbătorile legale", () => {
  assert.equal(orthodoxEaster(2026), "2026-04-12");
  assert.equal(orthodoxEaster(2027), "2027-05-02");
  assert.equal(isWorkingDay("2026-04-10"), false); // Vinerea Mare
  assert.equal(isWorkingDay("2026-06-01"), false); // Rusalii + 1 iunie
  assert.equal(isWorkingDay("2026-12-01"), false);
  assert.equal(isWorkingDay("2026-11-25"), true);
});

test("5 zile lucrătoare sar peste weekend și sărbători", () => {
  assert.equal(addWorkingDays("2026-11-25", 5), "2026-12-04"); // 30 nov și 1 dec sunt libere
  assert.equal(addWorkingDays("2026-11-27", 2), "2026-12-03");
  assert.equal(workingDaysLeft("2026-11-25", "2026-12-04"), 5);
  assert.equal(workingDaysLeft("2026-12-03", "2026-12-03"), 0);
  assert.ok(workingDaysLeft("2026-12-04", "2026-12-03") < 0);
});

test("termenul din notificare scurtează înregistrarea, apoi 2 zile pentru client", () => {
  const today = "2026-11-25";
  const a = gasRecordDeadlines({ drawn_up_on: "2026-11-25", notice_due_on: "2026-11-27", os_registered_on: null, client_delivered_on: null }, today);
  assert.equal(a.register.due, "2026-11-27");
  assert.equal(a.deliver, null);
  const b = gasRecordDeadlines({ drawn_up_on: "2026-11-20", os_registered_on: "2026-11-24", client_delivered_on: null }, today);
  assert.equal(b.register.done, true);
  assert.equal(b.deliver.due, "2026-11-26");
});

test("fișa are 15 operațiuni la verificare și 17 la revizie", () => {
  assert.equal(VERIFICARE_OPS.length, 15);
  assert.equal(REVIZIE_OPS.length, 17);
});

test("la „Nu” motivul e obligatoriu, câmpurile ascunse nu se cer", () => {
  const t = GAS_TEMPLATES.verificare;
  const ops = Object.fromEntries(VERIFICARE_OPS.map((_, i) => [String(i + 1), { v: "da" }]));
  ops["6"] = { v: "nu" };
  const miss = missingRequired(t, { operatiuni: ops, intrerupt: false, siguranta: "da", concluzie: "da" });
  assert.ok(miss.includes("Operațiunea 6: motivul pentru „Nu”"));
  assert.ok(!miss.some((m) => m.startsWith("De la ce robinet")));
  const miss2 = missingRequired(t, { intrerupt: true });
  assert.ok(miss2.includes("De la ce robinet"));
});

test("rezumatul fișei: concluzie, întrerupere, ultimele documente", () => {
  const s = summarizeGasRecord({ concluzie: "nu", intrerupt: true, aparate: [{ cos_data: "2026-09-01", iscir_data: "2025-03-01" }, { cos_data: "2026-10-01" }] });
  assert.deepEqual(s, { conform: false, gasInterrupted: true, docCos: "2026-10-01", docIscir: "2025-03-01" });
});

test("registrul anual: ordine după dată, coloanele anexei 6, CSV pentru Excel", async () => {
  const { buildRegister, registerCsv } = await import("../src/lib/gas-register.ts");
  const rows = buildRegister([
    { kind: "revizie", number: 2, drawn_up_on: "2026-11-20", conform: false, data: { client: "Ion; Pop", adresa: "Bl. A4, ap. 3", instalatie: "individuala", contract_nr: "12", contract_data: "2026-11-01" } },
    { kind: "verificare", number: 1, drawn_up_on: "2026-11-10", conform: true, data: { client: "Ana", instalatie: "ambele" } },
  ]);
  assert.equal(rows[0].client, "Ana");
  assert.equal(rows[0].comuna, true);
  assert.deepEqual(rows[1].revizie, { nr: "2", data: "20.11.2026" });
  assert.equal(rows[1].contract, "12 / 01.11.2026");
  const csv = registerCsv(rows);
  assert.ok(csv.startsWith("﻿Nr. crt.;"));
  assert.ok(csv.includes('"Ion; Pop"'));
  assert.ok(csv.includes(";Nu\r\n"));
});
