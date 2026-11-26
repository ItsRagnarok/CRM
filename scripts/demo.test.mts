import { test } from "node:test";
import assert from "node:assert/strict";
import { DEMO_DEFAULT_OPEN, DEMO_FEATURES, demoLocked, lockedPaths } from "../src/lib/demo";

const future = new Date(Date.now() + 864e5).toISOString();
const past = new Date(Date.now() - 864e5).toISOString();

test("contul client nu are nimic blocat", () => {
  assert.equal(demoLocked({ account_type: "client", demo_unlocked: [] }, "facturare"), false);
});

test("subfuncția e blocată când secțiunea e blocată, chiar dacă e bifată", () => {
  const org = { account_type: "demo", demo_unlocked: ["stoc.masini"], demo_expires_at: future };
  assert.equal(demoLocked(org, "stoc"), true);
  assert.equal(demoLocked(org, "stoc.masini"), true);
});

test("secțiune deschisă cu o subfuncție blocată", () => {
  const org = { account_type: "demo", demo_unlocked: ["stoc", "stoc.scule"], demo_expires_at: future };
  assert.equal(demoLocked(org, "stoc"), false);
  assert.equal(demoLocked(org, "stoc.scule"), false);
  assert.equal(demoLocked(org, "stoc.masini"), true);
  assert.ok(lockedPaths(org).includes("/materiale/masini"));
  assert.ok(!lockedPaths(org).includes("/materiale"));
});

test("după expirare totul e blocat", () => {
  const org = { account_type: "demo", demo_unlocked: DEMO_FEATURES.map((f) => f.id), demo_expires_at: past };
  assert.equal(demoLocked(org, "lucrari"), true);
});

test("varianta recomandată: lucrările deschise, facturarea blocată", () => {
  const org = { account_type: "demo", demo_unlocked: DEMO_DEFAULT_OPEN, demo_expires_at: future };
  assert.equal(demoLocked(org, "lucrari"), false);
  assert.equal(demoLocked(org, "facturare"), true);
  assert.equal(demoLocked(org, "facturare.noua"), true);
});

test("fiecare subfuncție are o secțiune-mamă existentă, iar id-urile sunt unice și scurte", () => {
  const ids = new Set(DEMO_FEATURES.map((f) => f.id));
  assert.equal(ids.size, DEMO_FEATURES.length);
  for (const f of DEMO_FEATURES) {
    if (f.parent) assert.ok(ids.has(f.parent), f.id);
    assert.ok(f.id.length <= 40, f.id);
  }
});
