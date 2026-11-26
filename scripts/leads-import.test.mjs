import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLeadsFile, romaniaToIso, companyKey } from "../src/lib/leads-import.ts";

test("ora României devine UTC, iarna și vara; data fără oră = prânz", () => {
  assert.equal(romaniaToIso("2026-11-25T08:30"), "2026-11-25T06:30:00.000Z");
  assert.equal(romaniaToIso("2026-07-10T08:30"), "2026-07-10T05:30:00.000Z");
  assert.equal(romaniaToIso("2026-11-25"), "2026-11-25T10:00:00.000Z");
  assert.equal(romaniaToIso("25.11.2026"), null);
});

test("fișierul corect devine leaduri cu istoric, trimis/primit marcat", () => {
  const { leads, errors } = parseLeadsFile(JSON.stringify({ format: "electrofield-leads", versiune: 1, leaduri: [
    { firma: "ASCORP", persoana: "Sorin", etapa: "contactat", domenii: ["electric", "hvac"], reluare: "2026-11-27",
      istoric: [{ data: "2026-11-25T08:30", tip: "email", directie: "trimis", text: "Bună Sorin" }, { data: "2026-11-25", tip: "fax", directie: "primit", text: "Mulțumim" }] },
    { persoana: "fără firmă" },
  ] }));
  assert.equal(leads.length, 1);
  assert.equal(errors.length, 1);
  const l = leads[0];
  assert.deepEqual(l.domains, ["electric"]);
  assert.equal(l.stage, "contactat");
  assert.equal(l.events[0].body, "Trimis: Bună Sorin");
  assert.equal(l.events[1].kind, "nota");
  assert.equal(l.events[1].body, "Primit: Mulțumim");
});

test("format greșit sau JSON stricat se refuză cu mesaj", () => {
  assert.match(parseLeadsFile("{").errors[0], /JSON/);
  assert.match(parseLeadsFile(JSON.stringify({ leaduri: [] })).errors[0], /formatul/);
});

test("aceeași firmă scrisă diferit se recunoaște", () => {
  assert.equal(companyKey("QuickShop.ro (SC Vertical CIA SRL)"), companyKey("quickshop ro  (sc vertical cia srl)"));
  assert.equal(companyKey("Rețele"), "retele");
});
