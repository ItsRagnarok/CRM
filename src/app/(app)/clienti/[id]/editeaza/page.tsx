import { notFound } from "next/navigation";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EditClientForm } from "./edit-client-form";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, client_type, name, company_name, cui, phone, email, address")
    .eq("organization_id", organization.id)
    .eq("id", id)
    .maybeSingle();

  if (!client) notFound();

  return <EditClientForm client={client} />;
}
