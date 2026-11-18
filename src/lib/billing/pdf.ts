import PDFDocument from "pdfkit";
import path from "node:path";
import type { InvoiceDetail } from "./types";
import { money, displayDate } from "./money";
export async function invoicePdf(d: InvoiceDetail): Promise<Buffer> {
  const fonts = path.join(
    process.cwd(),
    "src/app/api/rapoarte-lucrare/[id]/fonts",
  );
  const pdf = new PDFDocument({
    size: "A4",
    margin: 45,
    font: path.join(fonts, "NotoSans-Regular.ttf"),
    bufferPages: true,
    info: {
      Title: `${d.provider_series} ${d.provider_number}`,
      Author: d.company.name ?? "ElectroField",
    },
  });
  pdf.registerFont("regular", path.join(fonts, "NotoSans-Regular.ttf"));
  pdf.registerFont("bold", path.join(fonts, "NotoSans-Bold.ttf"));
  const chunks: Buffer[] = [];
  const complete = new Promise<Buffer>((resolve, reject) => {
    pdf.on("data", (c) => chunks.push(c));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);
  });
  const heading =
    d.document_type === "proforma"
      ? "PROFORMĂ"
      : d.document_type === "credit_note"
        ? "FACTURĂ DE STORNARE"
        : "FACTURĂ";
  pdf.font("bold").fontSize(24).fillColor("#6d4aff").text(heading);
  pdf
    .fontSize(14)
    .fillColor("#202034")
    .text(`${d.provider_series} ${d.provider_number}`);
  pdf
    .font("regular")
    .fontSize(9)
    .fillColor("#666677")
    .text(
      `Data: ${displayDate(d.issue_date)}   •   Scadență: ${displayDate(d.due_date)}`,
    )
    .moveDown(2);
  const top = pdf.y;
  function party(label: string, p: InvoiceDetail["company"], x: number) {
    pdf
      .font("bold")
      .fontSize(9)
      .fillColor("#666677")
      .text(label, x, top, { width: 235 });
    pdf
      .fontSize(11)
      .fillColor("#202034")
      .text(p.name ?? "", x, pdf.y + 5, { width: 235 });
    pdf.font("regular").fontSize(9);
    for (const v of [
      p.cui ? `CUI ${p.cui}` : "",
      p.registration_number,
      p.address,
      [p.city, p.county].filter(Boolean).join(", "),
      p.email,
    ])
      if (v) pdf.text(v, { width: 235 });
    return pdf.y;
  }
  const left = party("FURNIZOR", d.company, 45),
    right = party("CLIENT", d.client, 315);
  pdf.y = Math.max(left, right) + 30;
  pdf.x = 45;
  function header() {
    const y = pdf.y;
    pdf.rect(45, y, 505, 25).fill("#f1effa");
    pdf.fillColor("#444455").font("bold").fontSize(8);
    pdf.text("Produs / serviciu", 52, y + 7, { width: 215 });
    pdf.text("Cantitate", 272, y + 7, { width: 65, align: "right" });
    pdf.text("Preț (lei)", 342, y + 7, { width: 65, align: "right" });
    pdf.text("TVA", 412, y + 7, { width: 50, align: "right" });
    pdf.text("Valoare (lei)", 467, y + 7, { width: 76, align: "right" });
    pdf.y = y + 34;
  }
  header();
  for (const l of d.lines) {
    const height = Math.max(
      36,
      pdf.font("regular").fontSize(9).heightOfString(l.name, { width: 210 }) +
        16,
    );
    if (pdf.y + height > 730) {
      pdf.addPage();
      header();
    }
    const y = pdf.y;
    pdf.font("regular").fontSize(9).fillColor("#202034");
    pdf.text(l.name, 52, y, { width: 210 });
    pdf.text(`${l.quantity} ${l.unit}`, 272, y, { width: 65, align: "right" });
    pdf.text(l.unit_price, 342, y, { width: 65, align: "right" });
    pdf.text(`${l.vat_rate}%`, 412, y, { width: 50, align: "right" });
    pdf.text(money(l.net_amount).replace(" lei", ""), 467, y, {
      width: 76,
      align: "right",
    });
    pdf
      .moveTo(45, y + height - 8)
      .lineTo(550, y + height - 8)
      .strokeColor("#e6e4ed")
      .stroke();
    pdf.y = y + height;
  }
  if (pdf.y > 620) pdf.addPage();
  pdf.y += 15;
  for (const [label, value] of [
    ["Subtotal", d.subtotal],
    ["TVA", d.vat_total],
    ["TOTAL DE PLATĂ", d.total],
  ]) {
    const y = pdf.y;
    pdf
      .font(label.startsWith("TOTAL") ? "bold" : "regular")
      .fontSize(label.startsWith("TOTAL") ? 12 : 10);
    pdf.text(label, 300, y, { width: 115 });
    pdf.text(money(value), 410, y, { width: 135, align: "right" });
    pdf.y = y + 25;
  }
  pdf.x = 45;
  pdf.moveDown();
  pdf.font("regular").fontSize(9);
  if (d.notes) pdf.text(d.notes, { width: 505 });
  for (const bank of d.company.banks ?? [])
    pdf.text(`${bank.bank_name}: ${bank.iban}`, { width: 505 });
  pdf
    .moveDown()
    .fillColor("#777788")
    .fontSize(8)
    .text(
      "Document emis prin Oblio. Copie generată de ElectroField din datele salvate la emitere.",
      { width: 505 },
    );
  const range = pdf.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    pdf.switchToPage(i);
    pdf
      .font("regular")
      .fontSize(8)
      .fillColor("#888899")
      .text(`${i + 1} / ${range.count}`, 45, 785, {
        align: "center",
        width: 505,
        lineBreak: false,
      });
  }
  pdf.end();
  return complete;
}
