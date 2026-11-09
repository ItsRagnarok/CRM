import { smartbillBody, smartbillIssue, smartbillCheck, smartbillPayment } from "./smartbill.ts";
import { oblioBody, oblioIssue, oblioPayment, oblioCheck } from "./oblio.ts";
const conn = (provider: any) => ({ provider, accountEmail: "a@b.ro", vatCode: "RO123", series: "EF", taxPercent: 21, dueDays: 15, sendEmail: true, simulated: false });
const draft = { client: { name: "Hotel X", vatCode: "RO999", isTaxPayer: true, address: "Str A 1, Cluj-Napoca", city: "Cluj-Napoca", email: "c@x.ro" }, lines: [{ name: "Manoperă", unit: "buc", quantity: 1, price: 825, isService: true }, { name: "Materiale", unit: "buc", quantity: 1, price: 840, isService: false }], issueDate: "2026-11-09", dueDate: "2026-11-24" };
let ok = 0, bad = 0; const t = (n: string, c: boolean) => { c ? ok++ : bad++; console.log((c ? "PASS " : "FAIL ") + n); };
const calls: any[] = [];
function mock(handler: (url: string, init: any) => { status?: number; body: any }) {
  (globalThis as any).fetch = async (url: string, init: any) => { calls.push({ url, init }); const r = handler(url, init); return { ok: (r.status ?? 200) < 400, status: r.status ?? 200, text: async () => typeof r.body === "string" ? r.body : JSON.stringify(r.body) }; };
}
// SmartBill body
const sb = smartbillBody(conn("smartbill"), draft) as any;
t("SB body: companyVatCode/seriesName", sb.companyVatCode === "RO123" && sb.seriesName === "EF");
t("SB body: client country + vat", sb.client.country === "Romania" && sb.client.vatCode === "RO999" && sb.client.isTaxPayer === true);
t("SB body: produse cu TVA 21 Normala, preț fără TVA", sb.products.length === 2 && sb.products.every((p: any) => p.taxPercentage === 21 && p.taxName === "Normala" && p.isTaxIncluded === false));
t("SB body: sendEmail doar cu email client", sb.sendEmail === true);
t("SB body: 0% fără taxName", !("taxName" in (smartbillBody({ ...conn("smartbill"), taxPercent: 0 }, draft) as any).products[0]));
// SmartBill issue ok
mock(() => ({ body: { errorText: "", number: "0039", series: "EF", url: "https://x/pdf" } }));
const r1 = await smartbillIssue(conn("smartbill"), "tok", draft);
t("SB issue: număr și serie", r1.number === "0039" && r1.series === "EF");
t("SB issue: Basic auth + POST /invoice/v2", calls.at(-1).url.endsWith("/invoice/v2") && calls.at(-1).init.method === "POST" && calls.at(-1).init.headers.Authorization === "Basic " + Buffer.from("a@b.ro:tok").toString("base64"));
mock(() => ({ body: { errorText: "Seria nu exista", number: "", series: "" } }));
let e1 = ""; try { await smartbillIssue(conn("smartbill"), "tok", draft); } catch (e: any) { e1 = e.message; }
t("SB issue: errorText devine eroare lizibilă", e1.includes("Seria nu exista"));
mock(() => ({ status: 401, body: "" }));
e1 = ""; try { await smartbillIssue(conn("smartbill"), "bad", draft); } catch (e: any) { e1 = e.message; }
t("SB: 401 → mesaj de acces refuzat", e1.includes("refuzat"));
mock(() => ({ status: 502, body: "<html>Bad gateway</html>" }));
e1 = ""; try { await smartbillIssue(conn("smartbill"), "tok", draft); } catch (e: any) { e1 = e.message; }
t("SB: 502 HTML → eroare, nu crash", e1.startsWith("SmartBill:"));
mock(() => ({ body: { errorText: "", list: [{ name: "EF" }, { name: "PRO" }] } }));
t("SB check: seria există", (await smartbillCheck(conn("smartbill"), "tok")).series.length === 2);
e1 = ""; try { await smartbillCheck({ ...conn("smartbill"), series: "ZZ" }, "tok"); } catch (e: any) { e1 = e.message; }
t("SB check: serie inexistentă → listează seriile", e1.includes("ZZ") && e1.includes("EF"));
mock(() => ({ body: { errorText: "", paid: false, unpaidAmount: 100, paidAmount: 0 } }));
t("SB payment: neplătită", (await smartbillPayment(conn("smartbill"), "tok", "EF", "0039")).paid === false);
mock(() => ({ body: { errorText: "", paid: true, unpaidAmount: 0, paidAmount: 100 } }));
t("SB payment: plătită", (await smartbillPayment(conn("smartbill"), "tok", "EF", "0039")).paid === true);
// Oblio
const ob = oblioBody(conn("oblio"), draft, "Normala") as any;
t("Oblio body: cif/seriesName/vatIncluded=0", ob.cif === "RO123" && ob.seriesName === "EF" && ob.products.every((p: any) => p.vatIncluded === 0 && p.vatName === "Normala" && p.vatPercentage === 21));
t("Oblio body: tip produs Serviciu/Marfa", ob.products[0].productType === "Serviciu" && ob.products[1].productType === "Marfa");
calls.length = 0;
mock((url) => url.endsWith("/authorize/token") ? { body: { access_token: "T1", expires_in: 3600 } } : url.includes("vat_rates") ? { body: { status: 200, data: [{ name: "Normala", percent: 21 }, { name: "Redusa", percent: 11 }] } } : { body: { status: 200, statusMessage: "Success", data: { seriesName: "EF", number: 12, link: "https://oblio/show" } } });
const r2 = await oblioIssue(conn("oblio"), "sec", draft);
t("Oblio issue: număr/serie/link", r2.number === "12" && r2.series === "EF" && r2.url === "https://oblio/show");
t("Oblio issue: token → vat_rates → docs/invoice, Bearer", calls.length === 3 && calls[2].url.endsWith("/docs/invoice") && calls[2].init.headers.Authorization === "Bearer T1");
mock((url) => url.endsWith("/authorize/token") ? { body: { access_token: "T1" } } : { body: { status: 200, data: [{ name: "Normala", percent: 19 }] } });
e1 = ""; try { await oblioIssue(conn("oblio"), "sec", draft); } catch (e: any) { e1 = e.message; }
t("Oblio issue: fără cota 21 în cont → mesaj clar", e1.includes("21%"));
mock(() => ({ status: 400, body: { error: "invalid_client" } }));
e1 = ""; try { await oblioIssue(conn("oblio"), "bad", draft); } catch (e: any) { e1 = e.message; }
t("Oblio: token refuzat → mesaj de acces", e1.includes("refuzat"));
let n = 0; mock((url) => { if (url.endsWith("/authorize/token")) { n++; return n === 1 ? { status: 400, body: {} } : { body: { access_token: "T2" } }; } return { body: { status: 200, data: [{ name: "EF", type: "Factura" }] } }; });
t("Oblio: reîncearcă token form-encoded după JSON respins", (await oblioCheck(conn("oblio"), "sec")).series[0] === "EF" && n === 2);
mock((url) => url.endsWith("/authorize/token") ? { body: { access_token: "T" } } : { body: { status: 200, data: { total: 100, collects: [{ value: 100 }], einvoice: { status: 1 } } } });
const p2 = await oblioPayment(conn("oblio"), "sec", "EF", "12");
t("Oblio payment: plătită + e-Factura trimisă", p2.paid === true && p2.eInvoice === "trimisă");
console.log(`\n${ok} trecute, ${bad} căzute`); process.exit(bad ? 1 : 0);
