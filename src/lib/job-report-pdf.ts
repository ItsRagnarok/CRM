import "server-only";
import path from "path";
import PDFDocument from "pdfkit";
import { JOB_STATUS_LABELS, JOB_TYPE_LABELS } from "@/lib/status";

const FONT_DIR = path.join(process.cwd(), "src/app/api/rapoarte-lucrare/[id]/fonts");

export type JobReportData = {
  company: string;
  number: number;
  title: string;
  status: string;
  jobType: string;
  date: string | null;
  description: string | null;
  client: string | null;
  address: string | null;
  people: string | null;
  checklist: { label: string; is_checked: boolean }[];
  expenses: { category: string; vendor: string | null; amount: number | string; currency: string }[];
  photoCount: number;
  signature: { name: string; at: string } | null;
  signatureImage: Buffer | null;
};

const ro = (iso: string) => new Date(iso).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" });

/** Raportul de intervenție (A4). Folosit în platformă, în aplicație și pe linkul clientului. */
export async function buildJobReportPdf(r: JobReportData): Promise<Buffer> {
  // pdfkit's default constructor eagerly loads its bundled "Helvetica" standard font via a package
  // subpath import that Vercel's output file tracing doesn't pick up (MODULE_NOT_FOUND in production).
  // Passing our own font as the initial one skips that path entirely.
  const regularFontPath = path.join(FONT_DIR, "NotoSans-Regular.ttf");
  const doc = new PDFDocument({ size: "A4", margin: 40, font: regularFontPath, info: { Title: `Raport lucrare #${r.number}` } });
  doc.registerFont("Regular", regularFontPath);
  doc.registerFont("Bold", path.join(FONT_DIR, "NotoSans-Bold.ttf"));

  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const left = doc.page.margins.left;
  const pageWidth = doc.page.width - left - doc.page.margins.right;
  const muted = "#667085";
  const dark = "#101828";

  const top = doc.y;
  doc.font("Bold").fontSize(15).fillColor(dark).text(r.company, left, top, { width: pageWidth - 170 });
  doc.font("Regular").fontSize(10).fillColor(muted).text("Raport de intervenție", left, doc.y, { width: pageWidth - 170 });
  const afterTitle = doc.y;
  doc.fontSize(9).fillColor(muted).text(`Generat: ${ro(new Date().toISOString())}`, left, top + 4, { width: pageWidth, align: "right" });
  doc.y = Math.max(afterTitle, doc.y) + 6;
  doc.moveTo(left, doc.y).lineTo(left + pageWidth, doc.y).strokeColor(dark).lineWidth(1.5).stroke();
  doc.y += 16;

  doc.font("Bold").fontSize(16).fillColor(dark).text(`Lucrare #${r.number} — ${r.title}`, left, doc.y, { width: pageWidth });
  doc.font("Regular").fontSize(10).fillColor(muted).text(
    `Status: ${JOB_STATUS_LABELS[r.status as keyof typeof JOB_STATUS_LABELS] ?? r.status} · Tip: ${JOB_TYPE_LABELS[r.jobType as keyof typeof JOB_TYPE_LABELS] ?? r.jobType}`,
    left, doc.y, { width: pageWidth },
  );
  doc.y += 12;

  // Caseta cu clientul, adresa, echipa și data: două coloane, rândurile cresc după text.
  const colW = pageWidth / 2;
  const boxTop = doc.y;
  const field = (label: string, value: string, col: number, y: number) => {
    const x = left + 14 + col * colW;
    doc.font("Bold").fontSize(8).fillColor("#98a2b3").text(label, x, y, { width: colW - 28 });
    doc.font("Bold").fontSize(11).fillColor(dark).text(value, x, doc.y + 1, { width: colW - 28 });
    return doc.y;
  };
  const row1 = boxTop + 12;
  const row2 = Math.max(field("CLIENT", r.client ?? "—", 0, row1), field("ADRESĂ", r.address ?? "—", 1, row1)) + 10;
  const end = Math.max(field("ECHIPĂ / TEHNICIENI", r.people ?? "—", 0, row2), field("DATA", r.date ?? "—", 1, row2)) + 12;
  doc.rect(left, boxTop, pageWidth, end - boxTop).strokeColor("#eaecf0").lineWidth(1).stroke();

  // De aici textul curge pe toată lățimea, de la marginea din stânga.
  doc.x = left;
  doc.y = end + 18;
  const heading = (t: string) => doc.font("Bold").fontSize(12).fillColor(dark).text(t, left, doc.y, { width: pageWidth });
  const line = (t: string, color = dark) => doc.font("Regular").fontSize(11).fillColor(color).text(t, left, doc.y, { width: pageWidth });

  if (r.description) {
    heading("Descriere lucrare");
    line(r.description);
    doc.moveDown(1);
  }

  heading("Checklist");
  if (r.checklist.length > 0) for (const item of r.checklist) line(`${item.is_checked ? "[x]" : "[ ]"} ${item.label}`);
  else line("Fără checklist completat.", muted);
  doc.moveDown(1);

  heading("Cheltuieli");
  if (r.expenses.length > 0) {
    let total = 0;
    for (const e of r.expenses) {
      total += Number(e.amount);
      const rowY = doc.y;
      doc.font("Regular").fontSize(11).fillColor(dark).text(e.vendor ? `${e.vendor} — ${e.category}` : e.category, left, rowY, { width: pageWidth - 110 });
      const nextY = doc.y;
      doc.font("Bold").fontSize(11).fillColor(dark).text(`${Number(e.amount).toFixed(2)} ${e.currency}`, left, rowY, { width: pageWidth, align: "right" });
      doc.y = Math.max(nextY, doc.y);
    }
    doc.moveDown(0.3);
    doc.font("Bold").fontSize(12).fillColor(dark).text(`Total: ${total.toFixed(2)} RON`, left, doc.y, { width: pageWidth, align: "right" });
  } else {
    line("Nicio cheltuială înregistrată.", muted);
  }
  doc.moveDown(1);

  line(`${r.photoCount} fotografii atașate lucrării.`);
  doc.moveDown(1.5);

  heading("Semnătură client");
  if (r.signature) {
    doc.moveDown(0.5);
    if (r.signatureImage) {
      try {
        doc.image(r.signatureImage, left, doc.y, { fit: [160, 60] });
        doc.y += 64;
      } catch {
        // Imagine coruptă sau într-un format necunoscut: raportul iese și fără ea.
      }
    }
    doc.font("Regular").fontSize(9).fillColor(muted).text(`Semnat de ${r.signature.name}, ${ro(r.signature.at)}`, left, doc.y, { width: pageWidth });
  } else {
    doc.moveDown(2.5);
    doc.moveTo(left, doc.y).lineTo(left + 220, doc.y).strokeColor("#d0d5dd").stroke();
  }

  doc.end();
  return done;
}
