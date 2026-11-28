import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isValidCui, extractCuis, extractEmails, decodeCfEmail, emailKind, extractPhones, usefulLinks,
  domainGuesses, hardFilterReasons, parseAnafTva, parseAnafBilant, sizeBucket, hostKey, toCsv,
} from "../src/lib/prospect.ts";

test("CUI: cifra de control", () => {
  assert.equal(isValidCui("14399840"), true); // Dante International
  assert.equal(isValidCui("RO14399840"), true);
  assert.equal(isValidCui("14399841"), false);
  assert.equal(isValidCui("abc"), false);
});

test("CUI din subsolul unui site", () => {
  const t = "VIMED SRL | J40/123/2010 | CUI: RO14399840 | Cod fiscal 12345678 | Tel 0722 111 222";
  assert.deepEqual(extractCuis(t), ["14399840"]);
  assert.deepEqual(extractCuis("C.I.F. 14399840"), ["14399840"]);
});

test("e-mailuri: mailto, ascunse, Cloudflare, fără gunoi", () => {
  const cf = "0f60696966616c4f7a7c6a7d21617d"; // office@user.ro criptat cu cheia 0x0f? se verifică mai jos
  const html = `<a href="mailto:Office@Firma.ro?subject=x">scrie</a> ion.pop [at] firma.ro
    <img src="logo@2x.png"> noreply@firma.ro <span data-cfemail="${cf}"></span>`;
  const got = extractEmails(html);
  assert.ok(got.includes("office@firma.ro"));
  assert.ok(got.includes("ion.pop@firma.ro"));
  assert.ok(!got.some((e) => e.includes("png") || e.startsWith("noreply")));
  const enc = (s, k) => k.toString(16).padStart(2, "0") + [...s].map((c) => (c.charCodeAt(0) ^ k).toString(16).padStart(2, "0")).join("");
  assert.equal(decodeCfEmail(enc("contact@test.ro", 0x2a)), "contact@test.ro");
  assert.equal(emailKind("office@x.ro"), "generic");
  assert.equal(emailKind("andrei.pop@x.ro"), "personal");
});

test("telefoane", () => {
  assert.deepEqual(extractPhones("Tel: +40 722 111 222, fix 021-312.45.67"), ["0722 111 222", "021 312 4567"]);
});

test("linkuri utile, doar pe același site, contact întâi", () => {
  const html = `<a href="/despre-noi">Despre</a><a href="https://alt.ro/contact">x</a><a href="/contact">Contact</a><a href="/blog/ceva">Blog</a><a href="/doc.pdf">Autorizare</a>`;
  assert.deepEqual(usefulLinks(html, "https://www.firma.ro/"), ["https://www.firma.ro/contact", "https://www.firma.ro/despre-noi"]);
});

test("domenii ghicite din nume", () => {
  const g = domainGuesses("S.C. Termo Gaz Instal S.R.L.");
  assert.ok(g.includes("termogazinstal.ro"));
  assert.ok(g.includes("termo-gaz-instal.ro"));
  assert.ok(domainGuesses("VIMED SRL").includes("vimed.ro"));
});

test("filtre dure ale campaniei", () => {
  const rules = { caen_codes: ["4322"], min_employees: 10, max_employees: 300, counties: ["Cluj", "București"], min_turnover: null };
  assert.deepEqual(hardFilterReasons({ active: true, caen: "4322", employees: 25, county: "Cluj", turnover: 1 }, rules), []);
  assert.equal(hardFilterReasons({ active: true, caen: "4322", employees: 4, county: "Cluj", turnover: 1 }, rules).length, 1);
  assert.equal(hardFilterReasons({ active: false, caen: "4711", employees: 25, county: "Iași", turnover: 1 }, rules).length, 3);
  assert.deepEqual(hardFilterReasons({ active: true, caen: "4322", employees: null, county: "Judetul Cluj", turnover: null }, rules), []);
});

test("ANAF: date generale și bilanț", () => {
  const c = parseAnafTva({ date_generale: { cui: 14399840, denumire: "X SRL", stare_inregistrare: "INREGISTRAT din data 1", cod_CAEN: "4322", telefon: "" },
    adresa_sediu_social: { sdenumire_Judet: "CLUJ", sdenumire_Localitate: "Mun. Cluj-Napoca" }, stare_inactiv: { statusInactivi: false, dataRadiere: "" } });
  assert.equal(c.active, true);
  assert.equal(c.county, "Cluj");
  assert.equal(c.city, "Cluj-Napoca");
  assert.equal(c.caen, "4322");
  assert.equal(parseAnafTva({ date_generale: { cui: 1, denumire: "Y", stare_inregistrare: "RADIERE din data 2" } }).active, false);
  const b = parseAnafBilant({ an: 2024, caen: 4322, i: [{ indicator: "I13", val_indicator: 5000000 }, { indicator: "I18", val_indicator: 0 }, { indicator: "I19", val_indicator: 1200 }, { indicator: "I20", val_indicator: 23 }] });
  assert.deepEqual(b, { year: 2024, employees: 23, turnover: 5000000, profit: -1200, caen: "4322" });
  assert.equal(parseAnafBilant({ an: 2025, i: [] }), null);
  assert.equal(sizeBucket(23), "10-49");
  assert.equal(sizeBucket(null), "necunoscut");
});

test("cheia de site și exportul CSV", () => {
  assert.equal(hostKey("https://www.Vimed.ro/contact"), "vimed.ro");
  assert.equal(hostKey("vimed.ro"), "vimed.ro");
  const csv = toCsv([{ a: "x, y", b: ["1", "2"] }], [{ key: "a", label: "A" }, { key: "b", label: "B" }]);
  assert.equal(csv, '﻿A,B\n"x, y","1; 2"');
});

test("adrese de firmă cu prefix sau sufix", () => {
  assert.equal(emailKind("instal.office@rap-group.ro"), "generic");
  assert.equal(emailKind("depozit.cluj@conexinstal.ro"), "generic");
  assert.equal(emailKind("zoltan.kertesz@conexinstal.ro"), "personal");
  assert.equal(emailKind("crito@crito.ro"), "generic");
});

test("CUI-uri din rezultate de căutare", async () => {
  const { cuisFromSearchText } = await import("../src/lib/prospect.ts");
  const t = '{"title":"17998739 TEHNOTERM SRL","url":"https://termene.ro/firma/17998739-TEHNOTERM-SRL"},{"url":"https://termene.ro/firma/45874191"},{"url":"https://termene.ro/firma/12345678"}';
  const got = cuisFromSearchText(t);
  assert.ok(got.includes("17998739"));
  assert.ok(!got.includes("12345678")); // cifra de control greșită
});

test("site-ul e al firmei?", async () => {
  const { siteMatch } = await import("../src/lib/prospect.ts");
  const firm = { cui: "13762211", name: "RAP INSTAL SRL", phone: "0268406220", city: "Mun. Brașov" };
  assert.equal(siteMatch({ cuis: ["13762211"], text: "", phones: [], title: null }, firm), "sigur");
  assert.equal(siteMatch({ cuis: [], text: "Rap Instal - instalații Brașov", phones: [], title: null }, firm), "sigur");
  assert.equal(siteMatch({ cuis: [], text: "Rap Instal instalații", phones: [], title: null }, firm), "probabil");
  assert.equal(siteMatch({ cuis: ["14399840"], text: "Rap Instal Brașov", phones: [], title: null }, firm), "nu");
  assert.equal(siteMatch({ cuis: [], text: "Alt Instal Brașov", phones: [], title: null }, firm), "nu");
});
