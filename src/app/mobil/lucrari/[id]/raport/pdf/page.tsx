import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PdfViewer } from "./pdf-viewer";

/** PDF-ul raportului, văzut în aplicație, cu „Înapoi” la ecranul raportului. */
export default async function MobileReportPdfPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string }> }) {
  const { id } = await params;
  const { from } = await searchParams;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("id, display_number").eq("id", id).eq("organization_id", organization.id).maybeSingle();
  if (!job) notFound();
  const back = `/mobil/lucrari/${id}/raport${from === "gata" ? "?from=gata" : ""}`;

  return (
    <div className="flex h-full flex-col">
      <header className="m-hd">
        <Link href={back} aria-label="Înapoi" className="m-ib sm">
          <ChevronRight className="m-i" style={{ transform: "rotate(180deg)" }} />
        </Link>
        <div className="m-fl" style={{ textAlign: "center" }}>
          <div className="m-lb">Raport PDF · #{job.display_number}</div>
        </div>
        <span style={{ width: 44 }} aria-hidden="true" />
      </header>
      <div className="m-bd" style={{ background: "var(--m-bg, #f4f5f7)" }}>
        <PdfViewer url={`/api/rapoarte-lucrare/${id}?inline=1`} />
      </div>
      <div className="m-ft">
        <Link href={back} className="m-btn">Înapoi la raport · trimite clientului</Link>
      </div>
    </div>
  );
}
