import path from "path";
import PDFDocument from "pdfkit";
import { NextRequest, NextResponse } from "next/server";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JOB_STATUS_LABELS, JOB_TYPE_LABELS } from "@/lib/status";

const FONT_DIR = path.join(process.cwd(), "src/app/api/rapoarte-lucrare/[id]/fonts");

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select(
      "*, clients(name, address), locations(address), teams(name), job_assignments(profiles(full_name))"
    )
    .eq("organization_id", organization.id)
    .eq("id", id)
    .maybeSingle();

  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [{ data: expenses }, { data: checklist }, { count: photoCount }, { data: signature }] =
    await Promise.all([
      supabase.from("expenses").select("category, vendor, amount, currency").eq("job_id", id),
      supabase
        .from("job_checklists")
        .select("job_checklist_items(label, is_checked)")
        .eq("job_id", id)
        .eq("phase", "after")
        .maybeSingle(),
      supabase.from("photos").select("id", { count: "exact", head: true }).eq("job_id", id),
      supabase.from("signatures").select("signer_name, signed_at, storage_path").eq("job_id", id).maybeSingle(),
    ]);

  const assignees = job.job_assignments.map((a) => a.profiles?.full_name).filter((n): n is string => Boolean(n));
  const total = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  const checklistItems = checklist?.job_checklist_items ?? [];

  let signatureImage: Buffer | null = null;
  if (signature) {
    try {
      const { data } = await supabase.storage.from("attachments").download(signature.storage_path);
      if (data) signatureImage = Buffer.from(await data.arrayBuffer());
    } catch {
      // No signature image is not fatal — the report just shows a blank line.
    }
  }

  // pdfkit's default constructor eagerly loads its bundled "Helvetica"
  // standard font via a package subpath import (#standard-fonts/Helvetica)
  // that Vercel's output file tracing doesn't pick up, crashing every
  // request in production (MODULE_NOT_FOUND) while working fine locally.
  // Passing our own font as the initial one skips that path entirely.
  const regularFontPath = path.join(FONT_DIR, "NotoSans-Regular.ttf");
  const doc = new PDFDocument({ size: "A4", margin: 40, font: regularFontPath });
  doc.registerFont("Regular", regularFontPath);
  doc.registerFont("Bold", path.join(FONT_DIR, "NotoSans-Bold.ttf"));

  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const muted = "#667085";
  const dark = "#101828";

  doc.font("Bold").fontSize(15).fillColor(dark).text(organization.name);
  doc.font("Regular").fontSize(10).fillColor(muted).text("Raport de intervenție");
  doc
    .fontSize(9)
    .fillColor(muted)
    .text(`Generat: ${new Date().toLocaleString("ro-RO")}`, doc.page.margins.left, doc.y - 22, {
      width: pageWidth,
      align: "right",
    });
  doc.moveTo(doc.page.margins.left, doc.y + 8).lineTo(doc.page.margins.left + pageWidth, doc.y + 8).strokeColor(dark).lineWidth(1.5).stroke();
  doc.moveDown(1.5);

  doc.font("Bold").fontSize(16).fillColor(dark).text(`Lucrare #${job.display_number} — ${job.title}`);
  doc
    .font("Regular")
    .fontSize(10)
    .fillColor(muted)
    .text(`Status: ${JOB_STATUS_LABELS[job.status]} · Tip: ${JOB_TYPE_LABELS[job.job_type]}`);
  doc.moveDown(1);

  const infoBoxTop = doc.y;
  doc.rect(doc.page.margins.left, infoBoxTop, pageWidth, 90).strokeColor("#eaecf0").lineWidth(1).stroke();
  const colW = pageWidth / 2;
  const infoField = (label: string, value: string, col: number, row: number) => {
    const x = doc.page.margins.left + 14 + col * colW;
    const y = infoBoxTop + 14 + row * 40;
    doc.font("Bold").fontSize(8).fillColor("#98a2b3").text(label, x, y);
    doc.font("Bold").fontSize(11).fillColor(dark).text(value, x, y + 11, { width: colW - 24 });
  };
  infoField("CLIENT", job.clients?.name ?? "—", 0, 0);
  infoField("ADRESĂ", job.locations?.address ?? job.clients?.address ?? "—", 1, 0);
  infoField("ECHIPĂ / TEHNICIENI", assignees.length > 0 ? assignees.join(", ") : (job.teams?.name ?? "—"), 0, 1);
  infoField("DATA", job.scheduled_date, 1, 1);
  doc.y = infoBoxTop + 100;

  if (job.description) {
    doc.font("Bold").fontSize(12).fillColor(dark).text("Descriere lucrare");
    doc.font("Regular").fontSize(11).fillColor(dark).text(job.description, { width: pageWidth });
    doc.moveDown(1);
  }

  doc.font("Bold").fontSize(12).fillColor(dark).text("Checklist");
  if (checklistItems.length > 0) {
    for (const item of checklistItems) {
      doc.font("Regular").fontSize(11).fillColor(dark).text(`${item.is_checked ? "[x]" : "[ ]"} ${item.label}`);
    }
  } else {
    doc.font("Regular").fontSize(11).fillColor(muted).text("Fără checklist completat.");
  }
  doc.moveDown(1);

  doc.font("Bold").fontSize(12).fillColor(dark).text("Cheltuieli");
  if (expenses && expenses.length > 0) {
    for (const e of expenses) {
      const label = e.vendor ? `${e.vendor} — ${e.category}` : e.category;
      const rowY = doc.y;
      doc.font("Regular").fontSize(11).fillColor(dark).text(label, doc.page.margins.left, rowY, { width: pageWidth - 100 });
      doc
        .font("Bold")
        .fontSize(11)
        .fillColor(dark)
        .text(`${Number(e.amount).toFixed(2)} ${e.currency}`, doc.page.margins.left, rowY, { width: pageWidth, align: "right" });
    }
    doc.moveDown(0.3);
    doc.font("Bold").fontSize(12).fillColor(dark).text(`Total: ${total.toFixed(2)} RON`, { width: pageWidth, align: "right" });
  } else {
    doc.font("Regular").fontSize(11).fillColor(muted).text("Nicio cheltuială înregistrată.");
  }
  doc.moveDown(1);

  doc.font("Regular").fontSize(11).fillColor(dark).text(`${photoCount ?? 0} fotografii atașate lucrării.`);
  doc.moveDown(1.5);

  doc.font("Bold").fontSize(12).fillColor(dark).text("Semnătură client");
  if (signature && signatureImage) {
    doc.moveDown(0.5);
    try {
      doc.image(signatureImage, { fit: [160, 60] });
    } catch {
      // Corrupt/unsupported image format — fall through without blocking the report.
    }
    doc
      .font("Regular")
      .fontSize(9)
      .fillColor(muted)
      .text(`Semnat de ${signature.signer_name}, ${new Date(signature.signed_at).toLocaleString("ro-RO")}`);
  } else {
    doc.moveDown(2.5);
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.margins.left + 220, doc.y)
      .strokeColor("#d0d5dd")
      .stroke();
  }

  doc.end();
  const buffer = await done;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="lucrare-${job.display_number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
