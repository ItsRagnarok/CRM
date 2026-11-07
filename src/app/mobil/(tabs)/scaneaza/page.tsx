import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ScreenHeader } from "@/components/mobile/ui";
import { ScanFlow } from "./scan-flow";

export default async function ScanPage({ searchParams }: { searchParams: Promise<{ job?: string; tip?: string }> }) {
  const sp = await searchParams;
  const { profile } = await requireSessionContext();
  const supabase = await createClient();
  const { data: assignments } = await supabase
    .from("job_assignments")
    .select("jobs(id, display_number, title, status, scheduled_date, clients(name))")
    .eq("profile_id", profile.id);
  const jobs = (assignments ?? [])
    .map((a) => a.jobs)
    .filter((j): j is NonNullable<typeof j> => Boolean(j) && j!.status !== "anulata")
    .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date))
    .slice(0, 30)
    .map((j) => ({ id: j.id, label: `#${j.display_number} · ${j.clients?.name ?? "Client"} · ${j.title}` }));

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Scanează" subtitle="Bon, factură, etichetă sau document" />
      <ScanFlow jobs={jobs} defaultJobId={sp.job && jobs.some((j) => j.id === sp.job) ? sp.job : ""} defaultType={["bon", "factura", "eticheta", "document"].includes(sp.tip ?? "") ? (sp.tip as "bon") : "bon"} />
    </div>
  );
}
