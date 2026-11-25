import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAmount, parseDate, normalizeReceipt, normalizePlate, brandModel, parseModelJson, countCorrections } from "../src/lib/ai-extract.ts";

test("sume în format românesc", () => {
  assert.equal(parseAmount("1.234,56 lei"), 1234.56);
  assert.equal(parseAmount("1234.5"), 1234.5);
  assert.equal(parseAmount("1 234,00"), 1234);
  assert.equal(parseAmount(87.499), 87.5);
  assert.equal(parseAmount("abc"), null);
  assert.equal(parseAmount(-5), null);
});

test("data de pe bon: plauzibilă, nu în viitor", () => {
  assert.equal(parseDate("24.11.2026", "2026-11-25"), "2026-11-24");
  assert.equal(parseDate("2026-11-20", "2026-11-25"), "2026-11-20");
  assert.equal(parseDate("2026-12-01", "2026-11-25"), null);
  assert.equal(parseDate("31.02.2026", "2026-11-25"), null);
  assert.equal(parseDate("2020-01-01", "2026-11-25"), null);
});

test("bonul: totalul, TVA mai mic decât totalul, articole fără nume scoase", () => {
  const r = normalizeReceipt({ furnizor: "  Dedeman  SRL ", data: "25.11.2026", total: "245,90", tva: "39,26", articole: [{ denumire: "Cablu MYYM 3x2,5", cantitate: 10, pret_total: "89,90" }, { denumire: "", pret_total: 3 }] }, "2026-11-25");
  assert.equal(r.furnizor, "Dedeman SRL");
  assert.equal(r.total, 245.9);
  assert.equal(r.tva, 39.26);
  assert.equal(r.articole.length, 1);
  assert.equal(normalizeReceipt({ total: 10, tva: 12 }, "2026-11-25").tva, null);
});

test("plăcuța: seria fără prefix și spații; marca o singură dată", () => {
  const p = normalizePlate({ marca: "Huawei", model: "SUN2000-10KTL-M1", serie: "S/N: HV21 4501 2299", putere: "10 kW" });
  assert.equal(p.serie, "HV2145012299");
  assert.equal(brandModel(p), "Huawei SUN2000-10KTL-M1");
  assert.equal(brandModel({ marca: "Fronius", model: "Fronius Symo 8.2" }), "Fronius Symo 8.2");
  assert.equal(normalizePlate({ serie: "null" }).serie, null);
});

test("JSON din răspunsul modelului și corecturile omului", () => {
  assert.deepEqual(parseModelJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(parseModelJson('Iată: {"a":2} gata'), { a: 2 });
  assert.equal(parseModelJson("nimic"), null);
  assert.deepEqual(countCorrections({ total: 245.9, furnizor: "Dedeman", data: null }, { total: "245,90", furnizor: "Arabesque" }), { fields: 2, corrected: 1 });
});
