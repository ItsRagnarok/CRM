import { NextRequest, NextResponse } from "next/server";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildJobReportPdf } from "@/lib/job-report-pdf";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  let signatureImage: Buffer | null = null;
  if (signature) {
    try {
      const { data } = await supabase.storage.from("attachments").download(signature.storage_path);
      if (data) signatureImage = Buffer.from(await data.arrayBuffer());
    } catch {
      // Fără imaginea semnăturii raportul iese oricum, cu numele semnatarului.
    }
  }

  const buffer = await buildJobReportPdf({
    company: organization.name,
    number: job.display_number,
    title: job.title,
    status: job.status,
    jobType: job.job_type,
    date: job.scheduled_date,
    description: job.description,
    client: job.clients?.name ?? null,
    address: job.locations?.address ?? job.clients?.address ?? null,
    people: assignees.length > 0 ? assignees.join(", ") : (job.teams?.name ?? null),
    checklist: checklist?.job_checklist_items ?? [],
    expenses: expenses ?? [],
    photoCount: photoCount ?? 0,
    signature: signature ? { name: signature.signer_name, at: signature.signed_at } : null,
    signatureImage,
  });

  // ?inline=1: se deschide în browser în loc să se descarce.
  const disposition = req.nextUrl.searchParams.get("inline") ? "inline" : "attachment";
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="lucrare-${job.display_number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
