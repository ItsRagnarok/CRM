import { test } from "node:test";
import assert from "node:assert/strict";
import { gpsProof, orgLocalToIso } from "../src/lib/time-corrections.ts";
import { defaultPhotoTag } from "../src/lib/photo-tags.ts";

test("ora României devine UTC corect, iarna și vara", () => {
  assert.equal(orgLocalToIso("2026-11-25", "08:30"), "2026-11-25T06:30:00.000Z");
  assert.equal(orgLocalToIso("2026-07-10", "08:30"), "2026-07-10T05:30:00.000Z");
  assert.equal(orgLocalToIso("2026-11-25", "00:15"), "2026-11-24T22:15:00.000Z");
  assert.equal(orgLocalToIso("2026-11-25", "25:00"), null);
  assert.equal(orgLocalToIso("25.11.2026", "08:30"), null);
});

test("GPS-ul e doar dovadă: distanță, fără GPS sau fără coordonate", () => {
  assert.deepEqual(gpsProof({ lat: null, lng: null }, { lat: 44.4, lng: 26.1 }), { label: "fără GPS", tone: "none" });
  assert.equal(gpsProof({ lat: 44.4, lng: 26.1 }, { lat: null, lng: null }).tone, "none");
  const near = gpsProof({ lat: 44.4268, lng: 26.1025 }, { lat: 44.4270, lng: 26.1027 });
  assert.equal(near.tone, "ok");
  assert.match(near.label, /m de lucrare/);
  const far = gpsProof({ lat: 44.4268, lng: 26.1025 }, { lat: 44.4800, lng: 26.1025 });
  assert.equal(far.tone, "warn");
  assert.match(far.label, /km de lucrare/);
});

test("poza rapidă primește eticheta după etapă", () => {
  assert.equal(defaultPhotoTag({ arrived: true, working: false, beforeCount: 0 }), "before");
  assert.equal(defaultPhotoTag({ arrived: true, working: true, beforeCount: 2 }), "during");
});
