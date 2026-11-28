import { notFound } from "next/navigation";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { GasRecordSheet } from "@/components/docs/gas-record-sheet";
import { ZoomBox } from "@/components/zoom-box";
import { DocScreen } from "../../doc-screen";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Fișa de evidență gaze a lucrării, în forma oficială, văzută în aplicație cu zoom. */
export default async function MobileGasRecordPage({ params }: { params: Promise<{ id: string; recordId: string }> }) {
  const { id, recordId } = await params;
  if (!UUID.test(recordId)) notFound();
  const { organization } = await requireSessionContext();
  const supabase = await createClient();
  // Tehnicianul vede doar fișele lucrărilor lui (regula din baza de date: alocat pe lucrare).
  const [{ data: r }, { data: auth }] = await Promise.all([
    supabase.from("gas_records").select("*").eq("id", recordId).eq("job_id", id).eq("organization_id", organization.id).maybeSingle(),
    supabase.from("compliance_items").select("title, expires_on").eq("organization_id", organization.id).eq("kind", "company").eq("domain", "gaze").order("expires_on", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!r) notFound();
  return (
    <DocScreen jobId={id} title={`Fișă de evidență${r.number ? ` nr. ${r.number}/${r.year}` : ""}`}>
      <ZoomBox width={820}>
        <GasRecordSheet r={r} auth={auth} organization={organization} />
      </ZoomBox>
    </DocScreen>
  );
}
