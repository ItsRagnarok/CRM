import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todayInOrgTimeZone } from "@/lib/date";
import { ScreenHeader } from "@/components/mobile/ui";
import { PurchaseForm } from "./purchase-form";

/** „Am cumpărat de la magazin”: bonul, ce ai luat și pentru ce lucrare, într-un singur ecran. */
export default async function UrgentPurchasePage() {
  const { profile, organization } = await requireSessionContext();
  const supabase = await createClient();
  const today = todayInOrgTimeZone();
  const [{ data: assignments }, { data: materials }] = await Promise.all([
    supabase.from("job_assignments").select("jobs(id, display_number, title, status, scheduled_date, clients(name))").eq("profile_id", profile.id),
    supabase.from("materials").select("id, name, unit").eq("organization_id", organization.id).eq("kind", "material").order("name").limit(500),
  ]);
  const jobs = (assignments ?? [])
    .map((a) => a.jobs)
    .filter((j): j is NonNullable<typeof j> => Boolean(j) && j!.status !== "anulata")
    .sort((a, b) => Math.abs(Date.parse(a.scheduled_date) - Date.parse(today)) - Math.abs(Date.parse(b.scheduled_date) - Date.parse(today)))
    .slice(0, 30);
  const current = jobs.find((j) => j.status === "in_lucru" || j.status === "pauza") ?? jobs.find((j) => j.scheduled_date === today) ?? jobs[0];
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Am cumpărat de la magazin" subtitle="Ajunge la birou ca cheltuială pe lucrare" back="/mobil/materiale" />
      <PurchaseForm
        jobs={jobs.map((j) => ({ id: j.id, label: `#${j.display_number} · ${j.clients?.name ?? "Client"} · ${j.title}` }))}
        defaultJobId={current?.id ?? ""}
        materials={(materials ?? []).map((m) => ({ id: m.id, name: m.name, unit: m.unit }))}
      />
    </div>
  );
}
