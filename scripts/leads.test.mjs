import { test } from "node:test";
import assert from "node:assert/strict";
import { nextStage, followUpState, pipelineValue, winRate, shortDate, isLeadStage, leadSourceLabel } from "../src/lib/leads.ts";

test("etapa următoare", () => {
  assert.equal(nextStage("nou"), "contactat");
  assert.equal(nextStage("oferta"), "negociere");
  assert.equal(nextStage("negociere"), null);
  assert.equal(nextStage("castigat"), null);
});

test("reluarea leadului", () => {
  assert.equal(followUpState("2026-11-25", "2026-11-26", "nou"), "intarziat");
  assert.equal(followUpState("2026-11-26", "2026-11-26", "oferta"), "azi");
  assert.equal(followUpState("2026-11-30", "2026-11-26", "contactat"), "viitor");
  assert.equal(followUpState(null, "2026-11-26", "nou"), "fara");
  assert.equal(followUpState("2026-11-01", "2026-11-26", "pierdut"), "fara");
});

test("valoarea din pipeline numără doar leadurile deschise", () => {
  const r = pipelineValue([
    { stage: "nou", estimated_value: "1500.50" },
    { stage: "negociere", estimated_value: 2000 },
    { stage: "castigat", estimated_value: 9000 },
    { stage: "oferta", estimated_value: null },
  ]);
  assert.equal(r.total, 3500.5);
  assert.equal(r.counted, 2);
});

test("rata de câștig", () => {
  assert.equal(winRate([{ stage: "nou" }]), null);
  assert.equal(winRate([{ stage: "castigat" }, { stage: "castigat" }, { stage: "pierdut" }, { stage: "nou" }]), 67);
});

test("etichete și date", () => {
  assert.equal(shortDate("2026-11-27"), "27.11.2026");
  assert.equal(isLeadStage("oferta"), true);
  assert.equal(isLeadStage("x"), false);
  assert.equal(leadSourceLabel("recomandare"), "Recomandare");
});
