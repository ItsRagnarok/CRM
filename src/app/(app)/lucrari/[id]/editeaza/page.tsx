import { notFound } from "next/navigation";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EditJobForm } from "./edit-job-form";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const [{ data: job }, { data: teams }] = await Promise.all([
    supabase
      .from("jobs")
      .select(
        "id, title, description, job_type, priority, scheduled_date, start_time, end_time, team_id, location_id, locations(address)"
      )
      .eq("organization_id", organization.id)
      .eq("id", id)
      .maybeSingle(),
    supabase.from("teams").select("id, name").eq("organization_id", organization.id).order("name"),
  ]);

  if (!job) notFound();

  return <EditJobForm job={job} teams={teams ?? []} />;
}
