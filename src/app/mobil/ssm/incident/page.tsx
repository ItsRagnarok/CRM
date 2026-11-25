import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ScreenHeader } from "@/components/mobile/ui";
import { IncidentForm } from "./incident-form";
import type { IncidentKind } from "@/lib/ssm";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KINDS = ["accident", "aproape", "incident_periculos", "echipament"];

/** Raport de incident sau aproape-accident, din aplicație. */
export default async function IncidentPage({ searchParams }: { searchParams: Promise<{ job?: string; tip?: string }> }) {
  const { job, tip } = await searchParams;
  await requireSessionContext();
  const supabase = await createClient();
  const jobId = job && UUID.test(job) ? job : null;
  const { data: j } = jobId ? await supabase.from("jobs").select("display_number, title").eq("id", jobId).maybeSingle() : { data: null };
  return (
    <div className="flex flex-col">
      <ScreenHeader title="Raportează un incident" back={j ? `/mobil/lucrari/${jobId}` : "/mobil/ssm"} />
      <IncidentForm jobId={j ? jobId : null} jobLabel={j ? `#${j.display_number} · ${j.title}` : null} defaultKind={KINDS.includes(tip ?? "") ? (tip as IncidentKind) : null} />
    </div>
  );
}
