import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todayInOrgTimeZone } from "@/lib/date";
import { ScreenHeader } from "@/components/mobile/ui";
import { ExpenseForm } from "./expense-form";

export default async function NewExpensePage({ searchParams }: { searchParams: Promise<{ job?: string }> }) {
  const { job: preselected } = await searchParams;
  const { profile } = await requireSessionContext();
  const supabase = await createClient();
  const { data: assignments } = await supabase
    .from("job_assignments")
    .select("jobs(id, display_number, title, status, scheduled_date, clients(name))")
    .eq("profile_id", profile.id);
  const jobs = (assignments ?? [])
    .map((a) => a.jobs)
    .filter((j): j is NonNullable<typeof j> => Boolean(j))
    .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date))
    .slice(0, 40)
    .map((j) => ({ id: j.id, label: `#${j.display_number} · ${j.clients?.name ?? "Client"} · ${j.title}` }));

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Cheltuială nouă" subtitle="Se trimite la birou pentru aprobare" back="/mobil/cheltuieli" />
      <ExpenseForm jobs={jobs} defaultJobId={preselected && jobs.some((j) => j.id === preselected) ? preselected : jobs[0]?.id ?? ""} today={todayInOrgTimeZone()} />
    </div>
  );
}
