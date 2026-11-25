import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NewJobForm } from "./new-job-form";
import { loadDurationStats } from "@/lib/job-durations-server";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; date?: string; teamId?: string; cerere?: string }>;
}) {
  const { clientId, date, teamId, cerere } = await searchParams;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const [{ data: clients }, { data: teams }, { data: locations }, { data: materials }, durations] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, address")
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
    supabase
      .from("materials")
      .select("id, name, category, kind")
      .eq("organization_id", organization.id)
      .order("category")
      .order("name"),
    loadDurationStats(supabase, organization.id),
  ]);

  // Lucrare făcută dintr-o cerere: titlul din prima propoziție, descrierea completă, adresa.
  const { data: request } = cerere && /^[0-9a-f-]{36}$/i.test(cerere)
    ? await supabase.from("service_requests").select("id, contact_name, description, address, status").eq("id", cerere).eq("organization_id", organization.id).maybeSingle()
    : { data: null };
  const fromRequest = request && request.status !== "programata"
    ? {
        id: request.id,
        contactName: request.contact_name,
        title: request.description.split(/[.\n!?]/)[0].trim().slice(0, 90),
        description: request.description,
        address: request.address,
      }
    : undefined;

  const locationsByClient: Record<string, { id: string; address: string; label: string | null }[]> = {};
  for (const loc of locations ?? []) {
    (locationsByClient[loc.client_id] ??= []).push(loc);
  }

  return (
    <NewJobForm
      clients={clients ?? []}
      teams={teams ?? []}
      locationsByClient={locationsByClient}
      materials={materials ?? []}
      defaultClientId={clientId}
      defaultDate={date}
      defaultTeamId={teamId}
      enabledDomains={organization.enabled_domains}
      durations={durations}
      fromRequest={fromRequest}
    />
  );
}
