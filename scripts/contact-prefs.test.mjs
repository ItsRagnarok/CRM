import { test } from "node:test";
import assert from "node:assert/strict";
import { channelActions, normMarketing, marketingCsv, prefsSummary, preferredHint } from "../src/lib/contact-prefs.ts";

test("canalul preferat e primul și marcat; fără preferință, WhatsApp primul", () => {
  const a = channelActions({ text: "x", phone: "0722 111 222", email: "a@b.ro", preferred: "email", wa: "40722111222" });
  assert.deepEqual(a.map((x) => x.id), ["email", "whatsapp", "sms", "telefon"]);
  assert.equal(a[0].preferred, true);
  assert.equal(a.filter((x) => x.preferred).length, 1);
  const b = channelActions({ text: "x", phone: "0722 111 222", wa: "40722111222" });
  assert.deepEqual(b.map((x) => x.id), ["whatsapp", "sms", "telefon"]);
  assert.ok(b.every((x) => !x.preferred));
  // preferă e-mail, dar nu are e-mail: rămâne ordinea obișnuită
  const c = channelActions({ text: "x", phone: "0722", preferred: "email", wa: "40722" });
  assert.deepEqual(c.map((x) => x.id), ["whatsapp", "sms", "telefon"]);
  assert.match(preferredHint("email", { phone: "0722" }), /nu are e-mail/);
});

test("acordul pentru oferte: doar canale valide, fără dubluri, în ordine fixă", () => {
  assert.deepEqual(normMarketing(["email", "telefon", "sms", "email", "x"]), ["sms", "email"]);
  assert.equal(prefsSummary("whatsapp", []), "Preferă WhatsApp · fără oferte");
  assert.equal(prefsSummary(null, ["email", "sms"]), "Canal nespecificat · oferte: SMS, E-mail");
});

test("lista pentru oferte: doar clienții cu acord și doar datele canalelor acceptate", () => {
  const csv = marketingCsv([
    { name: "Ion", phone: "0722", email: "ion@x.ro", marketing_channels: ["email"], contact_prefs_updated_at: "2026-11-25T10:00:00Z" },
    { name: "Ana", phone: "0733", email: "ana@x.ro", marketing_channels: [], contact_prefs_updated_at: null },
    { name: "=HYPERLINK(1)", phone: "0744", email: null, marketing_channels: ["sms"], contact_prefs_updated_at: null },
  ]);
  const rows = csv.replace("﻿", "").trim().split("\r\n");
  assert.equal(rows.length, 3);
  assert.equal(rows[1], "Ion;;ion@x.ro;E-mail;2026-11-25");
  assert.ok(!csv.includes("Ana"));
  assert.ok(rows[2].startsWith("'=HYPERLINK"));
});
