import path from "path";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JOB_STATUS_LABELS, JOB_TYPE_LABELS } from "@/lib/status";

const FONT_DIR = path.join(process.cwd(), "src/app/api/rapoarte-lucrare/[id]/fonts");
const PHOTO_LABELS: Record<string, string> = {
  depot_pickup: "Ridicare din depozit",
  before: "Înainte",
  during: "În timpul lucrării",
  after: "După",
};
const reportDate = new Intl.DateTimeFormat("ro-RO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Bucharest",
});

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

  const [{ data: expenses }, { data: checklist }, { data: photos, error: photosError }, { data: signature }] =
    await Promise.all([
      supabase.from("expenses").select("category, vendor, amount, currency").eq("job_id", id),
      supabase
        .from("job_checklists")
        .select("job_checklist_items(label, is_checked)")
        .eq("job_id", id)
        .eq("phase", "after")
        .maybeSingle(),
      supabase.from("photos").select("category, storage_path, taken_at").eq("job_id", id).order("taken_at").order("id"),
      supabase.from("signatures").select("signer_name, signed_at, storage_path").eq("job_id", id).maybeSingle(),
    ]);

  const assignees = job.job_assignments.map((a) => a.profiles?.full_name).filter((n): n is string => Boolean(n));
  const total = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  const checklistItems = checklist?.job_checklist_items ?? [];

  const attachments = supabase.storage.from("attachments");
  async function loadImage(storagePath: string, isSignature = false) {
    try {
      const { data } = await attachments.download(storagePath);
      if (!data) return null;
      const image = sharp(Buffer.from(await data.arrayBuffer()), { limitInputPixels: 60_000_000 })
        .rotate()
        .resize({ width: 960, height: 960, fit: "inside", withoutEnlargement: true });
      return await (isSignature ? image.png() : image.flatten({ background: "#ffffff" }).jpeg({ quality: 80 })).toBuffer();
    } catch {
      return null;
    }
  }

  // pdfkit's default constructor eagerly loads its bundled "Helvetica"
  // standard font via a package subpath import (#standard-fonts/Helvetica)
  // that Vercel's output file tracing doesn't pick up, crashing every
  // request in production (MODULE_NOT_FOUND) while working fine locally.
  // Passing our own font as the initial one skips that path entirely.
  const regularFontPath = path.join(FONT_DIR, "NotoSans-Regular.ttf");
  const doc = new PDFDocument({ size: "A4", margin: 40, font: regularFontPath, bufferPages: true });
  doc.registerFont("Regular", regularFontPath);
  doc.registerFont("Bold", path.join(FONT_DIR, "NotoSans-Bold.ttf"));

  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const muted = "#667085";
  const dark = "#101828";
  const blue = "#175CD3";
  const left = doc.page.margins.left;
  const line = "#DFE7F3";

  function ensureSpace(height: number) {
    if (doc.y + height > doc.page.height - doc.page.margins.bottom - 12) doc.addPage();
  }

  function section(label: string, firstContentHeight = 24) {
    ensureSpace(34 + firstContentHeight);
    const y = doc.y;
    doc.roundedRect(left, y + 2, 3, 14, 1.5).fill(blue);
    doc.font("Bold").fontSize(13).fillColor(dark).text(label, left + 10, y, { width: pageWidth - 10 });
    doc.x = left;
    doc.y += 7;
  }

  const accent = () => doc.rect(0, 0, doc.page.width, 6).fill(blue);
  accent();
  doc.on("pageAdded", accent);
  doc.font("Bold").fontSize(10).fillColor(blue).text("RAPORT DE INTERVENȚIE", left);
  doc.moveDown(0.4);
  doc.font("Bold").fontSize(14).fillColor(dark).text(organization.name, left);
  doc.font("Regular").fontSize(9).fillColor(muted).text(`Generat la ${reportDate.format(new Date())}`, left);
  doc.moveDown(1.4);

  doc.font("Bold").fontSize(20).fillColor(dark).text(`Lucrare #${job.display_number} — ${job.title}`, left);
  doc
    .font("Regular")
    .fontSize(10)
    .fillColor(muted)
    .text(`Status: ${JOB_STATUS_LABELS[job.status]} · Tip: ${JOB_TYPE_LABELS[job.job_type]}`);
  doc.moveDown(1);

  const infoRows = [
    [["CLIENT", job.clients?.name ?? "—"], ["DATA", job.scheduled_date]],
    [["ADRESĂ", job.locations?.address ?? job.clients?.address ?? "—"],
      ["ECHIPĂ / TEHNICIENI", assignees.length ? assignees.join(", ") : (job.teams?.name ?? "—")]],
  ];
  const columnWidth = pageWidth / 2;
  const fieldWidth = columnWidth - 26;
  for (const row of infoRows) {
    doc.font("Regular").fontSize(10);
    const height = 31 + Math.max(...row.map(([, value]) => doc.heightOfString(value, { width: fieldWidth })));
    ensureSpace(height);
    const y = doc.y;
    doc.roundedRect(left, y, pageWidth, height, 6).fill("#F2F6FC");
    row.forEach(([label, value], index) => {
      const x = left + 13 + index * columnWidth;
      doc.font("Bold").fontSize(8).fillColor(muted).text(label, x, y + 8, { width: fieldWidth });
      doc.font("Regular").fontSize(10).fillColor(dark).text(value, x, y + 21, { width: fieldWidth });
    });
    doc.x = left;
    doc.y = y + height + 5;
  }
  doc.y += 12;

  if (job.description) {
    section("Descrierea lucrării");
    doc.font("Regular").fontSize(11).fillColor(dark).text(job.description, left, doc.y, { width: pageWidth, lineGap: 2 });
    doc.moveDown(1);
  }

  section("Verificări");
  if (checklistItems.length > 0) {
    for (const item of checklistItems) {
      const width = pageWidth - 21;
      doc.font("Regular").fontSize(10);
      ensureSpace(doc.heightOfString(item.label, { width }) + 6);
      const y = doc.y;
      doc.roundedRect(left, y + 2, 10, 10, 2).fillAndStroke(item.is_checked ? "#D1FADF" : "#FFFFFF", item.is_checked ? "#027A48" : muted);
      if (item.is_checked) {
        doc.moveTo(left + 2, y + 7).lineTo(left + 4, y + 9).lineTo(left + 8, y + 4).strokeColor("#027A48").stroke();
      }
      doc.fillColor(dark).text(item.label, left + 21, y, { width });
      doc.x = left;
      doc.y += 5;
    }
  } else {
    doc.font("Regular").fontSize(11).fillColor(muted).text("Fără checklist completat.");
  }
  doc.moveDown(1);

  section("Cheltuieli");
  if (expenses && expenses.length > 0) {
    for (const e of expenses) {
      const label = e.vendor ? `${e.vendor} — ${e.category}` : e.category;
      doc.font("Regular").fontSize(11);
      ensureSpace(doc.heightOfString(label, { width: pageWidth - 100 }) + 5);
      const rowY = doc.y;
      doc.fillColor(dark).text(label, left, rowY, { width: pageWidth - 100 });
      const labelBottom = doc.y;
      doc
        .font("Bold")
        .fontSize(11)
        .fillColor(dark)
        .text(`${Number(e.amount).toFixed(2)} ${e.currency}`, doc.page.margins.left, rowY, { width: pageWidth, align: "right" });
      doc.y = Math.max(doc.y, labelBottom) + 4;
    }
    ensureSpace(25);
    doc.moveDown(0.3);
    doc.font("Bold").fontSize(12).fillColor(dark).text(`Total: ${total.toFixed(2)} RON`, { width: pageWidth, align: "right" });
  } else {
    doc.font("Regular").fontSize(11).fillColor(muted).text("Nicio cheltuială înregistrată.");
  }
  doc.moveDown(1);

  const signatureImage = signature ? await loadImage(signature.storage_path, true) : null;
  section("Semnătura clientului", signatureImage ? 120 : 44);
  if (signatureImage) {
    const y = doc.y;
    doc.roundedRect(left, y, pageWidth, 83, 7).lineWidth(1).strokeColor(line).stroke();
    doc.image(signatureImage, left + 12, y + 7, { fit: [pageWidth - 24, 69], align: "center", valign: "center" });
    doc.y = y + 91;
  } else {
    doc.font("Regular").fontSize(10).fillColor(muted).text(
      signature ? "Imaginea semnăturii nu a putut fi inclusă." : "Nicio semnătură înregistrată.",
      left,
    );
  }
  if (signature) {
    doc.font("Regular").fontSize(10).fillColor(dark).text(
      `Semnat de ${signature.signer_name} · ${reportDate.format(new Date(signature.signed_at))}`,
      left,
    );
  }
  doc.moveDown(1.3);

  const photoRows = photos ?? [];
  const photoWidth = (pageWidth - 12) / 2;
  const cardHeight = 166;
  section(photoRows.length ? `Fotografii (${photoRows.length})` : "Fotografii", photoRows.length ? cardHeight : 24);
  if (!photoRows.length) {
    doc.font("Regular").fontSize(10).fillColor(muted).text(
      photosError ? "Fotografiile nu au putut fi încărcate." : "Nicio fotografie atașată.",
      left,
    );
  }
  for (let index = 0; index < photoRows.length; index += 2) {
    const row = photoRows.slice(index, index + 2);
    const images = await Promise.all(row.map((photo) => loadImage(photo.storage_path)));
    ensureSpace(cardHeight);
    const y = doc.y;
    row.forEach((photo, column) => {
      const x = left + column * (photoWidth + 12);
      const image = images[column];
      doc.roundedRect(x, y, photoWidth, cardHeight, 7).fillAndStroke("#F7F9FC", line);
      if (image) {
        doc.image(image, x + 8, y + 8, { fit: [photoWidth - 16, 119], align: "center", valign: "center" });
      } else {
        doc.font("Regular").fontSize(10).fillColor(muted).text("Imagine indisponibilă", x + 8, y + 55, {
          width: photoWidth - 16,
          align: "center",
        });
      }
      doc.font("Bold").fontSize(10).fillColor(dark).text(
        `${index + column + 1}. ${PHOTO_LABELS[photo.category] ?? photo.category}`,
        x + 8, y + 130, { width: photoWidth - 16, lineBreak: false, ellipsis: true },
      );
      if (photo.taken_at) {
        doc.font("Regular").fontSize(8).fillColor(muted).text(
          reportDate.format(new Date(photo.taken_at)), x + 8, y + 147, { lineBreak: false },
        );
      }
    });
    doc.x = left;
    doc.y = y + cardHeight + 12;
  }

  const pages = doc.bufferedPageRange();
  for (let page = 0; page < pages.count; page++) {
    doc.switchToPage(pages.start + page);
    const y = doc.page.height - 26;
    doc.font("Regular").fontSize(8).fillColor(muted).text(`Lucrare #${job.display_number}`, left, y, { lineBreak: false });
    const pageLabel = `Pagina ${page + 1} / ${pages.count}`;
    doc.text(pageLabel, left + pageWidth - doc.widthOfString(pageLabel), y, { lineBreak: false });
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
