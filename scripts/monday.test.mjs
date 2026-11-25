import { test } from "node:test";
import assert from "node:assert/strict";
import { parseConfig, metricState, formatValue, thresholdText, marginPct, DEFAULT_CONFIG } from "../src/lib/monday.ts";

const report = {
  today: "2026-11-25",
  restante: { total: 39117.5, count: 24, over60: 9000, not_due: 0, not_due_count: 0, buckets: [], clients: [] },
  nefacturat: { count: 11, estimate: 19464, oldest: 33 },
  incasat: { last7: 6808, prev7: 15043.5 },
  facturat: { last30: 59720.5, prev30: 9337 },
  marja: { billed: 69057.5, cost: 64084, jobs: 39, missing: 0, by_type: [], by_team: [] },
  cereri: { count: 3, old: 1 },
  saptamana: { jobs: 18, no_team: 0 },
};

test("fără configurație: cifrele și pragurile implicite", () => {
  assert.deepEqual(parseConfig(null), DEFAULT_CONFIG);
  assert.deepEqual(parseConfig({}), DEFAULT_CONFIG);
});

test("configurația salvată: cel mult 3, fără valori necunoscute, fără dubluri", () => {
  const c = parseConfig({ metrics: ["cereri", "xyz", "cereri", "incasat", "marja", "facturat"], thresholds: { cereri: 0, incasat: "5000", marja: 25 } });
  assert.deepEqual(c.metrics, ["cereri", "incasat", "marja"]);
  assert.deepEqual(c.thresholds, { cereri: 0, marja: 25 });
});

test("prag: peste / sub / fără prag, la fel ca în baza de date", () => {
  const c = parseConfig({ metrics: ["restante", "marja", "incasat"], thresholds: { restante: 10000, marja: 30 } });
  assert.equal(metricState("restante", report, c), "peste");
  assert.equal(metricState("marja", report, c), "peste"); // 7% < 30%
  assert.equal(metricState("incasat", report, c), "fara_prag");
  assert.equal(metricState("saptamana", report, parseConfig({ metrics: ["saptamana"], thresholds: { saptamana: 0 } })), "ok");
  assert.equal(metricState("marja", { ...report, marja: { ...report.marja, billed: 0, cost: 0 } }, c), "fara_date");
});

test("afișare", () => {
  assert.equal(marginPct(69057.5, 64084), 7);
  assert.equal(formatValue("marja", 7), "7%");
  assert.equal(formatValue("restante", 39117.5), "39.118 lei");
  assert.equal(thresholdText("restante", 10000), "Alertă peste 10.000 lei");
  assert.equal(thresholdText("marja", 30), "Alertă sub 30%");
  assert.equal(thresholdText("cereri", undefined), "Fără prag");
});
