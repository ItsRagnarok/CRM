import ExcelJS from "exceljs";
import JSZip from "jszip";
import { workflow } from "@/lib/billing/store";
import { invoicePdf } from "@/lib/billing/pdf";
import type { InvoiceDetail } from "@/lib/billing/types";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function GET(request: Request) {
  const month = new URL(request.url).searchParams.get("month") ?? "";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    return new Response("Alege o lună validă.", { status: 400 });
  const issued = await workflow<InvoiceDetail[]>("export", { month });
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Facturi");
  sheet.columns = [
    { header: "Număr", key: "number", width: 20 },
    { header: "Tip", key: "type", width: 18 },
    { header: "Client", key: "client", width: 35 },
    { header: "Data", key: "date", width: 14 },
    { header: "Scadență", key: "due", width: 14 },
    { header: "Subtotal (RON)", key: "subtotal", width: 20 },
    { header: "TVA (RON)", key: "vat", width: 20 },
    { header: "Total (RON)", key: "total", width: 20 },
    { header: "Încasat (RON)", key: "paid", width: 20 },
    { header: "Sold (RON)", key: "balance", width: 20 },
  ];
  const zip = new JSZip();
  let bytes = 0;
  for (const r of issued) {
    sheet.addRow({
      number: `${r.provider_series} ${r.provider_number}`,
      type: r.document_type === "credit_note" ? "Stornare" : "Factură",
      client: r.client_name,
      date: r.issue_date,
      due: r.due_date,
      subtotal: r.subtotal,
      vat: r.vat_total,
      total: r.total,
      paid: r.paid,
      balance: r.balance,
    });
    const pdf = await invoicePdf(r);
    bytes += pdf.length;
    if (bytes > 40 * 1024 * 1024)
      return new Response("Exportul PDF depășește 40 MB.", { status: 422 });
    zip.file(`${r.id}.pdf`, pdf);
  }
  sheet.getRow(1).font = { bold: true };
  sheet.autoFilter = "A1:J1";
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  // Write decimal literals directly into OOXML, without a float conversion.
  // Excel's own 15-digit limit requires retaining very large values as text.
  const xlsx = await JSZip.loadAsync(await workbook.xlsx.writeBuffer());
  const xmlPath = "xl/worksheets/sheet1.xml";
  const xml = await xlsx.file(xmlPath)!.async("string");
  const amounts = [
    "subtotal",
    "vat_total",
    "total",
    "paid",
    "balance",
  ] as const;
  xlsx.file(
    xmlPath,
    xml.replace(
      /<c r="([F-J])(\d+)"([^>]*)>.*?<\/c>/g,
      (cell, column, row, attrs) => {
        const record = issued[Number(row) - 2];
        if (!record) return cell;
        const amount = record[amounts[column.charCodeAt(0) - 70]];
        if (
          !/^-?\d+\.\d{2}$/.test(amount) ||
          amount.replace(/[-.]/g, "").replace(/^0+/, "").length > 15
        )
          return cell;
        return `<c r="${column}${row}"${attrs.replace(/ t="[^"]*"/g, "")}><v>${amount}</v></c>`;
      },
    ),
  );
  zip.file(
    `Facturi-${month}.xlsx`,
    await xlsx.generateAsync({ type: "uint8array" }),
  );
  zip.file(
    "Citește-mă.txt",
    "Sumele sunt numerice. Valorile cu peste 15 cifre sunt păstrate ca text pentru a evita limita de precizie Excel. PDF-urile sunt copii generate din datele fiscale salvate la emitere. Proformele și ciornele sunt excluse.",
  );
  const data = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
  });
  return new Response(data as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="Facturi-${month}.zip"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
