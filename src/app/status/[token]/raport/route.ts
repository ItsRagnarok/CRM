import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildJobReportPdf } from "@/lib/job-report-pdf";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Report = {
  company: string; number: number; title: string; status: string; job_type: string; date: string | null; description: string | null;
  client: string | null; address: string | null; team: string | null; assignees: string[];
  checklist: { label: string; is_checked: boolean }[];
  expenses: { category: string; vendor: string | null; amount: number; currency: string }[];
  photo_count: number;
  signature: { name: string; at: string; path: string } | null;
};

/** Raportul de intervenție pentru client, fără cont, pe linkul de status al lucrării (doar după finalizare). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!UUID.test(token)) return new NextResponse("Link invalid.", { status: 404 });
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_job_report", { p_token: token });
  const r = data as unknown as Report | null;
  if (!r) return new NextResponse("Raportul nu este disponibil: linkul a expirat sau lucrarea nu este încă finalizată.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });

  let signatureImage: Buffer | null = null;
  if (r.signature?.path) {
    try {
      // Fără cont, fișierele clientului se citesc doar prin link semnat (politica „client package read”).
      const { data: signed } = await supabase.storage.from("attachments").createSignedUrl(r.signature.path, 60);
      const res = signed?.signedUrl ? await fetch(signed.signedUrl) : null;
      if (res?.ok) signatureImage = Buffer.from(await res.arrayBuffer());
    } catch {
      // Raportul iese și fără imagine, cu numele semnatarului.
    }
  }

  const buffer = await buildJobReportPdf({
    company: r.company,
    number: r.number,
    title: r.title,
    status: r.status,
    jobType: r.job_type,
    date: r.date,
    description: r.description,
    client: r.client,
    address: r.address,
    people: r.assignees.length > 0 ? r.assignees.join(", ") : r.team,
    checklist: r.checklist,
    expenses: r.expenses,
    photoCount: r.photo_count,
    signature: r.signature ? { name: r.signature.name, at: r.signature.at } : null,
    signatureImage,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="raport-lucrare-${r.number}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
