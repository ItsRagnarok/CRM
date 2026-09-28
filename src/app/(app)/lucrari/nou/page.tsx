import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NewJobForm } from "./new-job-form";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; date?: string; teamId?: string }>;
}) {
  const { clientId, date, teamId } = await searchParams;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const [{ data: clients }, { data: teams }, { data: locations }] = await Promise.all([
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
    supabase
      .from("locations")
      .select("id, client_id, address, label")
      .eq("organization_id", organization.id)
      .order("created_at"),
  ]);

  const locationsByClient: Record<string, { id: string; address: string; label: string | null }[]> = {};
  for (const loc of locations ?? []) {
    (locationsByClient[loc.client_id] ??= []).push(loc);
  }

  return (
    <NewJobForm
      clients={clients ?? []}
      teams={teams ?? []}
      locationsByClient={locationsByClient}
      defaultClientId={clientId}
      defaultDate={date}
      defaultTeamId={teamId}
    />
  );
}
