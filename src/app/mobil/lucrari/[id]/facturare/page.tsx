import { notFound, redirect } from "next/navigation";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { pairHours, formatHM } from "@/app/(app)/pontaj/lib";
import { ScreenHeader } from "@/components/mobile/ui";
import { BillingForm } from "./billing-form";

export default async function MobileBillingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, display_number, title, clients(name)")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!job) notFound();

  const [{ data: existing }, { data: entries }, { data: usage }, { data: expenses }] = await Promise.all([
    supabase.from("billing_requests").select("id").eq("job_id", id).eq("status", "new").maybeSingle(),
    supabase.from("time_entries").select("profile_id, job_id, event_type, occurred_at").eq("job_id", id),
    supabase.from("material_usage").select("quantity, materials(name, unit)").eq("job_id", id).gt("quantity", 0),
    supabase.from("expenses").select("amount").eq("job_id", id),
  ]);
  if (existing) redirect(`/mobil/lucrari/${id}/gata`);

  const hours = pairHours((entries ?? []).map((e) => ({ ...e, job_id: e.job_id ?? "" })), "work_start", "work_end");
  const expenseTotal = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Rezumat și facturare" subtitle={`#${job.display_number} · ${job.clients?.name ?? "Client"}`} back={`/mobil/lucrari/${id}`} />
      <BillingForm
        jobId={id}
        jobTitle={job.title}
        hoursLabel={formatHM(hours)}
        materials={(usage ?? []).map((u) => `${u.materials?.name ?? "Material"} · ${Number(u.quantity)} ${u.materials?.unit ?? "buc"}`)}
        expenseTotal={expenseTotal}
      />
    </div>
  );
}
