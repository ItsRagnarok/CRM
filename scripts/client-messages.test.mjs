import { test } from "node:test";
import assert from "node:assert/strict";
import { arrivalWindow, confirmationMessage, onTheWayMessage, waPhone } from "../src/lib/client-messages.ts";

test("fereastra de sosire", () => {
  assert.deepEqual(arrivalWindow("09:00:00", 120), { from: "09:00", to: "11:00" });
  assert.deepEqual(arrivalWindow("14:30", 90), { from: "14:30", to: "16:00" });
  assert.deepEqual(arrivalWindow("23:00", 120), { from: "23:00", to: "23:59" });
  assert.equal(arrivalWindow(null, 120), null);
});

test("mesajele", () => {
  const c = confirmationMessage({ company: "Instalații Demo", date: "2026-11-27", start: "09:00", windowMinutes: 120, link: "https://x/status/abc" });
  assert.match(c, /vineri, 27 noiembrie, între 09:00 și 11:00/);
  assert.match(c, /https:\/\/x\/status\/abc/);
  const o = onTheWayMessage({ company: "Instalații Demo", techName: "Andrei", link: "L", etaMinutes: 25 });
  assert.equal(o, "Bună ziua! Sunt Andrei de la Instalații Demo. Am plecat spre dumneavoastră. Ajungem în aproximativ 25 de minute. Aici vedeți stadiul lucrării: L");
});

test("telefon pentru WhatsApp", () => {
  assert.equal(waPhone("0722 000 111"), "40722000111");
  assert.equal(waPhone("+40 744 222 333"), "40744222333");
  assert.equal(waPhone(""), null);
});
