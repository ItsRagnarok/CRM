import test from "node:test";
import assert from "node:assert/strict";
import { totals, lineNet, lineVat, addDays } from "../src/lib/invoicing/calc.ts";

test("rândul: valoare fără TVA rotunjită, apoi TVA din ea", () => {
  assert.equal(lineNet({ quantity: 3, price: 33.333, vatPercent: 21, isService: true }), 100);
  assert.equal(lineVat({ quantity: 3, price: 33.333, vatPercent: 21, isService: true }), 21);
  assert.equal(lineVat({ quantity: 1, price: 0.05, vatPercent: 21, isService: true }), 0.01);
});

test("totaluri: servicii, bunuri, TVA pe cote, total cu TVA", () => {
  const t = totals([
    { quantity: 2.5, price: 150, vatPercent: 21, isService: true },
    { quantity: 4, price: 12.4, vatPercent: 21, isService: false },
    { quantity: 1, price: 100, vatPercent: 11, isService: false },
  ]);
  assert.equal(t.services, 375);
  assert.equal(t.goods, 149.6);
  assert.equal(t.net, 524.6);
  assert.equal(t.vat, 78.75 + 10.42 + 11);
  assert.equal(t.gross, 524.6 + 100.17);
  assert.deepEqual(t.byRate.map((b) => b.rate), [21, 11]);
});

test("storno: cantități negative dau totaluri negative", () => {
  const t = totals([{ quantity: -1, price: 200, vatPercent: 21, isService: true }]);
  assert.equal(t.net, -200);
  assert.equal(t.vat, -42);
  assert.equal(t.gross, -242);
});

test("scadența", () => {
  assert.equal(addDays("2026-11-26", 15), "2026-12-11");
  assert.equal(addDays("2026-12-25", 10), "2027-01-04");
});
