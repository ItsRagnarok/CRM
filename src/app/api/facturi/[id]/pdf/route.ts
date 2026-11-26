import path from "path";
import PDFDocument from "pdfkit";
import { NextResponse, type NextRequest } from "next/server";
import { requireBackOfficeContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { InvoicingError, documentPdf, loadConnection } from "@/lib/invoicing";

const FONT_DIR = path.join(process.cwd(), "src/app/api/rapoarte-lucrare/[id]/fonts");
const money = (n: number) => n.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });

/**
 * PDF-ul documentului. Cu un furnizor real: PDF-ul fiscal de la SmartBill (octeți) sau linkul Oblio.
 * În demo și în evidența internă: un PDF generat aici, marcat clar că nu e factură fiscală.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireBackOfficeContext();
  if (!ctx) return NextResponse.json({ error: "Fără acces" }, { status: 403 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const supabase = await createClient();
  const { data: inv } = await supabase.from("invoices")
    .select("*, invoice_lines(*), clients(name)")
    .eq("id", id).eq("organization_id", ctx.organization.id).maybeSingle();
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const fileName = `${inv.invoice_number.replace(/[^A-Za-z0-9-]+/g, "_")}.pdf`;

  if (inv.provider && !inv.simulated && inv.provider_series && inv.provider_number) {
    const connection = await loadConnection(supabase, ctx.organization.id);
    if (connection && connection.provider === inv.provider) {
      try {
        const pdf = await documentPdf(supabase, connection, { docType: inv.doc_type === "proforma" ? "proforma" : "factura", series: inv.provider_series, number: inv.provider_number }, inv.provider_url);
        if (pdf?.kind === "url") return NextResponse.redirect(pdf.url);
        if (pdf?.kind === "bytes") return new NextResponse(new Uint8Array(pdf.data), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${fileName}"`, "Cache-Control": "private, no-store" } });
      } catch (e) {
        if (inv.provider_url) return NextResponse.redirect(inv.provider_url);
        return new NextResponse(e instanceof InvoicingError ? e.message : "Furnizorul nu a trimis PDF-ul.", { status: 502, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
    }
    if (inv.provider_url) return NextResponse.redirect(inv.provider_url);
  }

  const org = ctx.organization;
  const client = (inv.client_snapshot ?? { name: inv.clients?.name }) as { name?: string; vatCode?: string | null; regCom?: string | null; address?: string | null; city?: string | null; county?: string | null; email?: string | null };
  const lines = [...(inv.invoice_lines ?? [])].sort((a, b) => a.position - b.position);
  const title = inv.doc_type === "proforma" ? "PROFORMĂ" : inv.doc_type === "storno" ? "FACTURĂ DE STORNARE" : "FACTURĂ";
  const regular = path.join(FONT_DIR, "NotoSans-Regular.ttf");
  const doc = new PDFDocument({ size: "A4", margin: 40, font: regular });
  doc.registerFont("Regular", regular);
  doc.registerFont("Bold", path.join(FONT_DIR, "NotoSans-Bold.ttf"));
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));
  const W = doc.page.width - 80;
  const dark = "#101828", muted = "#667085", line = "#e4e7ec";

  // Mențiunea care face clar că nu e document fiscal
  doc.save().rect(40, 34, W, 22).fill(inv.simulated ? "#fef0c7" : "#f2f4f7").restore();
  doc.font("Bold").fontSize(9).fillColor("#93370d").text(inv.simulated ? "DOCUMENT DE TEST (cont demonstrativ): fără valoare fiscală" : "EVIDENȚĂ INTERNĂ: nu este factură fiscală și nu a fost transmisă în e-Factura", 48, 40, { width: W - 16 });

  doc.font("Bold").fontSize(20).fillColor(dark).text(title, 40, 74);
  doc.font("Regular").fontSize(10).fillColor(muted).text(`Nr. ${inv.invoice_number} · din ${fmt(inv.issued_at)}${inv.due_date && inv.doc_type === "factura" ? ` · scadentă ${fmt(inv.due_date)}` : ""}`);

  const top = 126, colW = (W - 20) / 2;
  doc.font("Bold").fontSize(8).fillColor(muted).text("FURNIZOR", 40, top);
  doc.font("Bold").fontSize(11).fillColor(dark).text(org.name, 40, top + 12, { width: colW });
  doc.font("Regular").fontSize(9).fillColor(dark).text([org.cui ? `CUI ${org.cui}` : null, org.address, org.phone, org.email].filter(Boolean).join("\n"), { width: colW });
  doc.font("Bold").fontSize(8).fillColor(muted).text("CLIENT", 60 + colW, top);
  doc.font("Bold").fontSize(11).fillColor(dark).text(client.name ?? "", 60 + colW, top + 12, { width: colW });
  doc.font("Regular").fontSize(9).fillColor(dark).text([client.vatCode ? `CUI ${client.vatCode}` : null, client.regCom, [client.address, client.city, client.county].filter(Boolean).join(", "), client.email].filter(Boolean).join("\n"), 60 + colW, doc.y, { width: colW });

  let y = Math.max(doc.y, 210) + 18;
  const cols = [{ t: "Nr.", w: 26 }, { t: "Denumire", w: W - 26 - 40 - 50 - 70 - 40 - 80 }, { t: "UM", w: 40 }, { t: "Cant.", w: 50, r: true }, { t: "Preț", w: 70, r: true }, { t: "TVA", w: 40, r: true }, { t: "Valoare", w: 80, r: true }];
  const row = (vals: string[], bold = false) => {
    let x = 40; let h = 0;
    doc.font(bold ? "Bold" : "Regular").fontSize(9).fillColor(dark);
    vals.forEach((v, i) => { const opts = { width: cols[i].w - 6, align: cols[i].r ? ("right" as const) : ("left" as const) }; h = Math.max(h, doc.heightOfString(v, opts)); doc.text(v, x + 3, y + 5, opts); x += cols[i].w; });
    y += h + 10;
    doc.moveTo(40, y).lineTo(40 + W, y).strokeColor(line).lineWidth(0.6).stroke();
  };
  doc.save().rect(40, y, W, 20).fill("#f9fafb").restore();
  row(cols.map((c) => c.t), true);
  if (lines.length === 0) {
    const legacy = [["Manoperă", inv.labor_amount], ["Materiale", inv.materials_amount], ["Deplasare", inv.travel_amount], ["Alte costuri", inv.other_amount]].filter(([, v]) => Number(v));
    legacy.forEach(([n, v], i) => row([String(i + 1), String(n), "buc", "1", money(Number(v)), "-", money(Number(v))]));
  }
  lines.forEach((l, i) => {
    if (y > doc.page.height - 160) { doc.addPage(); y = 40; }
    row([String(i + 1), l.name, l.unit, Number(l.quantity).toLocaleString("ro-RO"), money(Number(l.unit_price)), `${Number(l.vat_percent)}%`, money(Number(l.net_amount))]);
  });

  const byRate = new Map<number, number>();
  for (const l of lines) byRate.set(Number(l.vat_percent), (byRate.get(Number(l.vat_percent)) ?? 0) + Number(l.line_vat));
  y += 8;
  const tot = (label: string, value: string, bold = false) => {
    doc.font(bold ? "Bold" : "Regular").fontSize(bold ? 12 : 10).fillColor(dark);
    doc.text(label, 40 + W - 260, y, { width: 150, align: "right" });
    doc.text(value, 40 + W - 110, y, { width: 110, align: "right" });
    y += bold ? 20 : 15;
  };
  tot("Total fără TVA", `${money(Number(inv.total_amount))} lei`);
  [...byRate.entries()].sort((a, b) => b[0] - a[0]).forEach(([r, v]) => tot(`TVA ${r}%`, `${money(v)} lei`));
  if (!lines.length && Number(inv.vat_amount)) tot("TVA", `${money(Number(inv.vat_amount))} lei`);
  tot("TOTAL DE PLATĂ", `${money(Number(inv.gross_amount))} lei`, true);
  if (inv.doc_type === "factura" && Number(inv.paid_amount) > 0) tot("Încasat", `${money(Number(inv.paid_amount))} lei`);
  if (inv.mentions) { y += 10; doc.font("Regular").fontSize(9).fillColor(muted).text(`Mențiuni: ${inv.mentions}`, 40, y, { width: W }); }

  doc.end();
  const buffer = await done;
  return new NextResponse(new Uint8Array(buffer), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${fileName}"`, "Cache-Control": "private, no-store" } });
}
