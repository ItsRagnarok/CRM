import { test } from "node:test";
import assert from "node:assert/strict";
import { calibrationState } from "../src/lib/tools.ts";

test("starea calibrării", () => {
  assert.equal(calibrationState(false, null, "2026-11-25"), null);
  assert.equal(calibrationState(true, null, "2026-11-25"), "lipsa");
  assert.equal(calibrationState(true, "2026-11-24", "2026-11-25"), "expirata");
  assert.equal(calibrationState(true, "2026-11-25", "2026-11-25"), "expira");
  assert.equal(calibrationState(true, "2026-12-20", "2026-11-25"), "expira");
  assert.equal(calibrationState(true, "2027-03-01", "2026-11-25"), "ok");
});
