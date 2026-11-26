/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-expressions -- test cu mock-uri de fetch */
import { smartbillBody, smartbillIssue, smartbillCheck, smartbillPayment, smartbillCollect, smartbillReverse, smartbillCancel, smartbillPdf, smartbillSendEmail, smartbillPayType } from "../src/lib/invoicing/smartbill";
import { oblioBody, oblioIssue, oblioPayment, oblioCheck, oblioCollectPayment, oblioReverse, oblioCancel, oblioEinvoice, oblioCollect } from "../src/lib/invoicing/oblio";

const conn = (provider: any, extra: any = {}) => ({ provider, accountEmail: "a@b.ro", vatCode: "RO123", series: "EF", proformaSeries: "EFP", receiptSeries: "EFC", taxPercent: 21, dueDays: 15, sendEmail: true, simulated: false, ...extra });
const draft: any = {
  docType: "factura", series: "EF",
  client: { name: "Hotel X", vatCode: "RO999", isTaxPayer: true, regCom: "J12/1/2020", address: "Str A 1", city: "Cluj-Napoca", county: "Cluj", email: "c@x.ro", phone: "0740" },
  lines: [{ name: "Manoperă", unit: "ore", quantity: 5.5, price: 150, vatPercent: 21, isService: true }, { name: "Robinet", unit: "buc", quantity: 2, price: 42, vatPercent: 11, isService: false }],
  issueDate: "2026-11-26", dueDate: "2026-12-11", mentions: "Lucrarea #12", sendEmail: true,
};
let ok = 0, bad = 0; const t = (n: string, c: boolean) => { c ? ok++ : bad++; console.log((c ? "PASS " : "FAIL ") + n); };
const calls: any[] = [];
function mock(handler: (url: string, init: any) => { status?: number; body: any; type?: string }) {
  (globalThis as any).fetch = async (url: string, init: any) => {
    calls.push({ url, init }); const r = handler(url, init); const text = typeof r.body === "string" ? r.body : JSON.stringify(r.body);
    return { ok: (r.status ?? 200) < 400, status: r.status ?? 200, headers: new Map([["content-type", r.type ?? "application/json"]]), text: async () => text, json: async () => JSON.parse(text), arrayBuffer: async () => new TextEncoder().encode(text).buffer };
  };
}
const err = async (f: () => Promise<unknown>) => { try { await f(); return ""; } catch (e: any) { return e.message as string; } };

// ── SmartBill: corpul facturii
const sb = smartbillBody(conn("smartbill"), draft) as any;
t("SB body: companyVatCode/seriesName", sb.companyVatCode === "RO123" && sb.seriesName === "EF");
t("SB body: client complet (regCom, county, phone)", sb.client.country === "Romania" && sb.client.vatCode === "RO999" && sb.client.regCom === "J12/1/2020" && sb.client.county === "Cluj" && sb.client.phone === "0740");
t("SB body: TVA pe rând (21 Normala, 11 Redusa), preț fără TVA", sb.products[0].taxPercentage === 21 && sb.products[0].taxName === "Normala" && sb.products[1].taxPercentage === 11 && sb.products[1].taxName === "Redusa" && sb.products.every((p: any) => p.isTaxIncluded === false));
t("SB body: e-mail către client", sb.sendEmail === true && sb.email.to === "c@x.ro");
t("SB body: mențiuni", sb.mentions === "Lucrarea #12");
const sbPaid = smartbillBody(conn("smartbill"), { ...draft, collect: { method: "numerar", amount: 100, date: "2026-11-26" } }) as any;
t("SB body: încasare numerar cu chitanță (seria de chitanțe)", sbPaid.payment.type === "Chitanta" && sbPaid.payment.isCash === true && sbPaid.payment.paymentSeries === "EFC" && sbPaid.paymentDate === "2026-11-26");
t("SB tip încasare: fără serie de chitanțe → Alta incasare numerar", smartbillPayType("numerar", null).type === "Alta incasare" && smartbillPayType("numerar", null).isCash);
t("SB tip încasare: OP / card", smartbillPayType("ordin_plata", "X").type === "Ordin plata" && smartbillPayType("card", "X").type === "Card");
const sbFromPf = smartbillBody(conn("smartbill"), { ...draft, fromProforma: { series: "EFP", number: "0007" } }) as any;
t("SB body: factură din proformă (useEstimateDetails)", sbFromPf.useEstimateDetails === true && sbFromPf.estimate.seriesName === "EFP" && sbFromPf.estimate.number === "0007");
const sbPf = smartbillBody(conn("smartbill"), { ...draft, docType: "proforma", collect: { method: "card", amount: 5, date: "2026-11-26" } }) as any;
t("SB body: proforma nu are încasare", !("payment" in sbPf));

// ── SmartBill: apeluri
mock(() => ({ body: { errorText: "", number: "0039", series: "EF", documentViewUrl: "https://sb/view" } }));
const r1 = await smartbillIssue(conn("smartbill"), "tok", draft);
t("SB issue: număr, serie, link public", r1.number === "0039" && r1.series === "EF" && r1.url === "https://sb/view");
t("SB issue: Basic auth + POST /invoice/v2", calls.at(-1).url.endsWith("/invoice/v2") && calls.at(-1).init.method === "POST" && calls.at(-1).init.headers.Authorization === "Basic " + Buffer.from("a@b.ro:tok").toString("base64"));
await smartbillIssue(conn("smartbill"), "tok", { ...draft, docType: "proforma", series: "EFP" });
t("SB proforma: POST /estimate/v2", calls.at(-1).url.endsWith("/estimate/v2"));
// Firmă neplătitoare de TVA: cota 0 primește numele exact din contul SmartBill (/tax), apoi factura.
mock((url) => url.includes("/tax?") ? { body: { errorText: "", taxes: [{ name: "Normala", percentage: 21 }, { name: "Neplatitor", percentage: 0 }] } } : { body: { errorText: "", number: "0040", series: "EF" } });
const nv = calls.length;
await smartbillIssue(conn("smartbill", { taxPercent: 0 }), "tok", { ...draft, lines: draft.lines.map((l: any) => ({ ...l, vatPercent: 0 })) });
const nvBody = JSON.parse(calls.at(-1).init.body);
t("SB neplătitor TVA: citește /tax, trimite cota 0 cu numele din cont", calls.length - nv === 2 && calls[nv].url.includes("/tax?") && nvBody.products.every((p: any) => p.taxPercentage === 0 && p.taxName === "Neplatitor"));
mock(() => ({ body: { errorText: "Seria nu exista", number: "", series: "" } }));
t("SB issue: errorText devine eroare lizibilă", (await err(() => smartbillIssue(conn("smartbill"), "tok", draft))).includes("Seria nu exista"));
mock(() => ({ status: 401, body: "" }));
t("SB: 401 → acces refuzat", (await err(() => smartbillIssue(conn("smartbill"), "bad", draft))).includes("refuzat"));
mock(() => ({ status: 502, body: "<html>Bad gateway</html>" }));
t("SB: 502 HTML → eroare, nu crash", (await err(() => smartbillIssue(conn("smartbill"), "tok", draft))).startsWith("SmartBill:"));
mock((url) => url.includes("/series") ? { body: { errorText: "", list: [{ name: "EF", type: "f" }, { name: "EFP", type: "p" }, { name: "EFC", type: "c" }] } } : { body: { errorText: "", taxes: [{ name: "Normala", percentage: 21 }, { name: "Redusa", percentage: 11 }] } });
const chk = await smartbillCheck(conn("smartbill"), "tok");
t("SB check: serii pe tipuri + cote TVA", chk.series[0] === "EF" && chk.catalog.proformaSeries[0] === "EFP" && chk.catalog.receiptSeries[0] === "EFC" && chk.catalog.vatRates.length === 2);
t("SB check: serie inexistentă → listează seriile", (await err(() => smartbillCheck(conn("smartbill", { series: "ZZ" }), "tok"))).includes("ZZ"));
mock(() => ({ body: { errorText: "", paid: false, unpaidAmount: 100, paidAmount: 21, invoiceTotalAmount: 121 } }));
const ps = await smartbillPayment(conn("smartbill"), "tok", "EF", "0039");
t("SB paymentstatus: parțial încasată", ps.paid === false && ps.paidAmount === 21 && ps.total === 121);
mock(() => ({ body: { errorText: "", series: "EFC", number: "0012" } }));
const col = await smartbillCollect(conn("smartbill"), "tok", { docType: "factura", series: "EF", number: "0039" }, { method: "numerar", amount: 50, date: "2026-11-27" });
const colBody = JSON.parse(calls.at(-1).init.body);
t("SB încasare: POST /payment cu invoicesList și chitanță", calls.at(-1).url.endsWith("/payment") && colBody.invoicesList[0].number === "0039" && colBody.type === "Chitanta" && colBody.seriesName === "EFC" && colBody.value === 50 && colBody.useInvoiceDetails === true && col.document === "Chitanța EFC 0012");
mock(() => ({ body: { errorText: "", message: "ok" } }));
await smartbillCancel(conn("smartbill"), "tok", { docType: "factura", series: "EF", number: "0039" });
t("SB anulare: PUT /invoice/cancel?cif&seriesname&number", calls.at(-1).init.method === "PUT" && calls.at(-1).url.includes("/invoice/cancel?cif=RO123&seriesname=EF&number=0039"));
await smartbillCancel(conn("smartbill"), "tok", { docType: "proforma", series: "EFP", number: "0007" }, true);
t("SB restaurare proformă: PUT /estimate/restore", calls.at(-1).url.includes("/estimate/restore?"));
mock(() => ({ body: { errorText: "", series: "EF", number: "0040", documentViewUrl: "https://sb/st" } }));
const st = await smartbillReverse(conn("smartbill"), "tok", { docType: "factura", series: "EF", number: "0039" }, "2026-11-28");
t("SB storno: POST /invoice/reverse", calls.at(-1).url.endsWith("/invoice/reverse") && JSON.parse(calls.at(-1).init.body).number === "0039" && st.number === "0040");
mock(() => ({ body: { status: { code: 0, message: "Trimis" } } }));
await smartbillSendEmail(conn("smartbill"), "tok", { docType: "factura", series: "EF", number: "0039" }, null);
t("SB e-mail: POST /document/send tip factura", calls.at(-1).url.endsWith("/document/send") && JSON.parse(calls.at(-1).init.body).type === "factura");
mock(() => ({ body: { status: { code: 1, message: "Clientul nu are email" } } }));
t("SB e-mail: status.code 1 → eroare", (await err(() => smartbillSendEmail(conn("smartbill"), "tok", { docType: "factura", series: "EF", number: "1" }, null))).includes("nu are email"));
mock(() => ({ body: "%PDF-1.4", type: "application/octet-stream" }));
const pdf = await smartbillPdf(conn("smartbill"), "tok", { docType: "factura", series: "EF", number: "0039" });
t("SB PDF: GET /invoice/pdf întoarce octeți", calls.at(-1).url.includes("/invoice/pdf?") && pdf.byteLength === 8);

// ── Oblio: corpul facturii
const names = new Map([[21, "Normala"], [11, "Redusa"]]);
const ob = oblioBody(conn("oblio"), draft, names) as any;
t("Oblio body: cif/seriesName/vatIncluded=0, cote pe rând", ob.cif === "RO123" && ob.seriesName === "EF" && ob.products.every((p: any) => p.vatIncluded === 0) && ob.products[0].vatName === "Normala" && ob.products[1].vatName === "Redusa");
t("Oblio body: client (rc, state)", ob.client.rc === "J12/1/2020" && ob.client.state === "Cluj" && ob.client.vatPayer === 1);
const obPaid = oblioBody(conn("oblio"), { ...draft, collect: { method: "ordin_plata", amount: 10, date: "2026-11-26", document: "OP 55" } }, names) as any;
t("Oblio body: încasare OP cu număr de document", obPaid.collect.type === "Ordin de plata" && obPaid.collect.documentNumber === "OP 55" && obPaid.collect.value === "10");
t("Oblio încasare numerar: chitanță cu serie", oblioCollect("numerar", "EFC", { method: "numerar", amount: 1, date: "x" }, "EF1").type === "Chitanta" && (oblioCollect("numerar", "EFC", { method: "numerar", amount: 1, date: "x" }, "EF1") as any).seriesName === "EFC");
const obFromPf = oblioBody(conn("oblio"), { ...draft, fromProforma: { series: "EFP", number: "8" } }, names) as any;
t("Oblio body: factură din proformă = referenceDocument Proforma", obFromPf.referenceDocument.type === "Proforma" && obFromPf.referenceDocument.number === "8" && !obFromPf.products);

// ── Oblio: apeluri
calls.length = 0;
mock((url) => url.endsWith("/authorize/token") ? { body: { access_token: "T1", expires_in: 3600 } } : url.includes("vat_rates") ? { body: { status: 200, data: [{ name: "Normala", percent: 21 }, { name: "Redusa", percent: 11 }] } } : { body: { status: 200, statusMessage: "Success", data: { seriesName: "EF", number: 12, link: "https://oblio/show" } } });
const r2 = await oblioIssue(conn("oblio"), "sec", draft);
t("Oblio issue: număr/serie/link", r2.number === "12" && r2.series === "EF" && r2.url === "https://oblio/show");
t("Oblio issue: token → vat_rates → docs/invoice, Bearer", calls.length === 3 && calls[2].url.endsWith("/docs/invoice") && calls[2].init.headers.Authorization === "Bearer T1");
await oblioIssue(conn("oblio"), "sec", { ...draft, docType: "proforma" });
t("Oblio proforma: POST /docs/proforma", calls.at(-1).url.endsWith("/docs/proforma"));
mock((url) => url.endsWith("/authorize/token") ? { body: { access_token: "T1" } } : { body: { status: 200, data: [{ name: "Normala", percent: 19 }] } });
t("Oblio issue: cotă lipsă în cont → mesaj clar", (await err(() => oblioIssue(conn("oblio"), "sec", draft))).includes("21"));
mock(() => ({ status: 400, body: { error: "invalid_client" } }));
t("Oblio: token refuzat → mesaj de acces", (await err(() => oblioIssue(conn("oblio"), "bad", draft))).includes("refuzat"));
mock((url) => url.endsWith("/authorize/token") ? { body: { access_token: "T2" } } : url.includes("series") ? { body: { status: 200, data: [{ name: "EF", type: "Factura" }, { name: "EFP", type: "Proforma" }, { name: "EFC", type: "Chitanta" }] } } : { body: { status: 200, data: [{ name: "Normala", percent: 21 }] } });
const oc = await oblioCheck(conn("oblio"), "sec");
t("Oblio check: serii pe tipuri", oc.series[0] === "EF" && oc.catalog.proformaSeries[0] === "EFP" && oc.catalog.receiptSeries[0] === "EFC");
mock((url) => url.endsWith("/authorize/token") ? { body: { access_token: "T" } } : url.includes("/list") ? { body: { status: 200, data: [{ total: "121.00", canceled: "0", einvoiceStatus: { code: 1, text: "Trimisa" } }] } } : { body: { status: 200, data: { collects: [{ value: 100 }, { value: 21 }] } } });
const p2 = await oblioPayment(conn("oblio"), "sec", "EF", "12");
t("Oblio stare: încasată integral + e-Factura trimisă", p2.paid === true && p2.paidAmount === 121 && p2.eInvoice === "trimisă" && p2.cancelled === false);
mock((url) => url.endsWith("/authorize/token") ? { body: { access_token: "T" } } : { body: { status: 200, data: { collects: [{ type: "Chitanta", number: "EFC 3" }] } } });
const oc2 = await oblioCollectPayment(conn("oblio"), "sec", { docType: "factura", series: "EF", number: "12" }, { method: "numerar", amount: 50, date: "2026-11-27" });
const form = new URLSearchParams(calls.at(-1).init.body);
t("Oblio încasare: PUT /docs/invoice/collect formular collect[...]", calls.at(-1).init.method === "PUT" && calls.at(-1).url.endsWith("/docs/invoice/collect") && form.get("collect[type]") === "Chitanta" && form.get("collect[seriesName]") === "EFC" && form.get("number") === "12" && oc2.document === "Chitanta EFC 3");
mock((url) => url.endsWith("/authorize/token") ? { body: { access_token: "T" } } : { body: { status: 200, statusMessage: "Documentul a fost anulat." } });
await oblioCancel(conn("oblio"), "sec", { docType: "factura", series: "EF", number: "12" });
t("Oblio anulare: PUT /docs/invoice/cancel", calls.at(-1).url.endsWith("/docs/invoice/cancel") && calls.at(-1).init.method === "PUT");
mock((url) => url.endsWith("/authorize/token") ? { body: { access_token: "T" } } : { body: { status: 200, data: { seriesName: "EF", number: 13, link: "l" } } });
const st2 = await oblioReverse(conn("oblio"), "sec", { docType: "factura", series: "EF", number: "12" }, "2026-11-28");
const stBody = JSON.parse(calls.at(-1).init.body);
t("Oblio storno: factură cu referenceDocument Factura", stBody.referenceDocument.type === "Factura" && stBody.referenceDocument.number === "12" && stBody.referenceDocument.refund === 0 && st2.number === "13");
mock((url) => url.endsWith("/authorize/token") ? { body: { access_token: "T" } } : { body: { status: 200, data: { text: "ok", sent: true, code: 0 } } });
t("Oblio e-Factura: POST /docs/einvoice → în prelucrare", (await oblioEinvoice(conn("oblio"), "sec", { docType: "factura", series: "EF", number: "12" })) === "în prelucrare" && calls.at(-1).url.endsWith("/docs/einvoice"));

console.log(`\n${ok} trecute, ${bad} căzute`); process.exit(bad ? 1 : 0);
