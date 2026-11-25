import { test } from "node:test";
import assert from "node:assert/strict";
import { effectiveMin, vehicleStockStatus, restockNeed } from "../src/lib/vehicle-stock.ts";

test("pragul implicit e jumătate din țintă", () => {
  assert.equal(effectiveMin(50, null), 25);
  assert.equal(effectiveMin(3, null), 2);
  assert.equal(effectiveMin(50, 10), 10);
  assert.equal(effectiveMin(null, 10), null);
});

test("starea pe mașină", () => {
  assert.equal(vehicleStockStatus({ quantity: 0, target_qty: 10, min_qty: 4 }), "lipsa");
  assert.equal(vehicleStockStatus({ quantity: 3, target_qty: 10, min_qty: 4 }), "sub_prag");
  assert.equal(vehicleStockStatus({ quantity: 4, target_qty: 10, min_qty: 4 }), "ok");
  assert.equal(vehicleStockStatus({ quantity: 7, target_qty: null, min_qty: null }), "fara_tinta");
});

test("sub prag se completează până la țintă; peste prag nu", () => {
  assert.equal(restockNeed({ quantity: 3, target_qty: 10, min_qty: 4 }), 7);
  assert.equal(restockNeed({ quantity: 0, target_qty: 50, min_qty: 20 }), 50);
  assert.equal(restockNeed({ quantity: 6, target_qty: 10, min_qty: 4 }), 0);
  assert.equal(restockNeed({ quantity: 0, target_qty: null, min_qty: null }), 0);
});
