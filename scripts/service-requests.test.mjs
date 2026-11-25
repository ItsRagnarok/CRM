import { test } from "node:test";
import assert from "node:assert/strict";
import { rescheduleMessage, waNumber, longDate, sourceLabel, windowLabel } from "../src/lib/service-requests.ts";

test("data lungă în română", () => {
  assert.equal(longDate("2026-11-27"), "vineri, 27 noiembrie");
  assert.equal(longDate("2026-12-01"), "marți, 1 decembrie");
});

test("mesajul de reprogramare pentru client", () => {
  const m = rescheduleMessage({ clientName: "Familia Pop", jobNumber: 142, jobTitle: "Montaj aer condiționat 12000 BTU — Familia Pop (casă)", fromDate: "2026-11-25", toDate: "2026-11-27", toStart: "09:00:00", toEnd: "11:00:00", reason: "material", companyName: "Instalații Demo Group SRL", companyPhone: "0700 000 000" });
  assert.match(m, /^Bună ziua, Familia Pop,/);
  assert.match(m, /Intervenția „Montaj aer condiționat 12000 BTU” \(lucrarea #142\), programată miercuri, 25 noiembrie, se mută, pentru că așteptăm un material necesar lucrării\./);
  assert.match(m, /Noua programare: vineri, 27 noiembrie, între 09:00 și 11:00\./);
  assert.match(m, /Instalații Demo Group SRL · 0700 000 000$/);
  const other = rescheduleMessage({ clientName: null, jobNumber: 5, jobTitle: "Revizie", fromDate: null, toDate: "2026-11-27", toStart: null, toEnd: null, reason: "altul", note: "drum închis.", companyName: "X" });
  assert.match(other, /^Bună ziua,\n/);
  assert.match(other, /se reprogramează \(drum închis\)\./);
  assert.match(other, /Noua programare: vineri, 27 noiembrie\./);
});

test("număr pentru WhatsApp", () => {
  assert.equal(waNumber("0722 123 456"), "40722123456");
  assert.equal(waNumber("+40 744 254 065"), "40744254065");
  assert.equal(waNumber("0040722123456"), "40722123456");
  assert.equal(waNumber("123"), null);
  assert.equal(waNumber(null), null);
});

test("etichete", () => {
  assert.equal(sourceLabel("site"), "Formular online");
  assert.equal(windowLabel("dimineata"), "dimineața (8–11)");
  assert.equal(windowLabel(null), "");
});
