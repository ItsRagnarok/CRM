import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NewJobForm } from "./new-job-form";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const [{ data: clients }, { data: teams }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name")
      .eq("organization_id", organization.id)
      .order("name"),
    supabase
      .from("teams")
      .select("id, name")
      .eq("organization_id", organization.id)
      .order("name"),
  ]);

  return (
    <NewJobForm
      clients={clients ?? []}
      teams={teams ?? []}
      defaultClientId={clientId}
    />
  );
}
