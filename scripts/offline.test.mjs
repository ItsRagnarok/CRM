import { test } from "node:test";
import assert from "node:assert/strict";
import { acceptClientTime, safeOpId } from "../src/lib/client-time.ts";

const NOW = Date.parse("2026-11-25T10:00:00Z");

test("ora reală a unei acțiuni făcute fără semnal se păstrează", () => {
  assert.equal(acceptClientTime("2026-11-25T07:30:00.000Z", NOW), "2026-11-25T07:30:00.000Z");
  assert.equal(acceptClientTime("2026-11-20T07:30:00.000Z", NOW), "2026-11-20T07:30:00.000Z");
});

test("ceas puțin înainte e tolerat, dar nu trece de ora serverului", () => {
  assert.equal(acceptClientTime("2026-11-25T10:03:00.000Z", NOW), "2026-11-25T10:00:00.000Z");
});

test("ore neplauzibile sunt înlocuite cu ora serverului", () => {
  const server = new Date(NOW).toISOString();
  assert.equal(acceptClientTime("2026-11-25T11:00:00Z", NOW), server, "viitor");
  assert.equal(acceptClientTime("2026-11-10T10:00:00Z", NOW), server, "mai vechi de 7 zile");
  assert.equal(acceptClientTime("ieri", NOW), server);
  assert.equal(acceptClientTime(undefined, NOW), server);
  assert.equal(acceptClientTime(12345, NOW), server);
});

test("id-ul operației din coadă e validat", () => {
  assert.equal(safeOpId("0f8e2b9c-1a2b-4c3d-8e9f-001122334455"), "0f8e2b9c-1a2b-4c3d-8e9f-001122334455");
  assert.equal(safeOpId("../../etc"), null);
  assert.equal(safeOpId(""), null);
  assert.equal(safeOpId(null), null);
});
