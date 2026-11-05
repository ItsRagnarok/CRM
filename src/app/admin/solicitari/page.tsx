import { revalidatePath } from "next/cache";
import Link from "next/link";
import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function resolveRequest(id: string) {
  "use server";
  await requireAdminContext();
  const supabase = await createClient();
  const { error } = await supabase.from("subscription_requests")
    .update({ resolved_at: new Date().toISOString() })
    .eq("id", id)
    .is("resolved_at", null);
  if (error) throw new Error("Solicitarea nu a putut fi marcată ca procesată.");
  revalidatePath("/admin/solicitari");
  revalidatePath("/setari");
}

export default async function AdminSubscriptionRequestsPage() {
  await requireAdminContext();
  const supabase = await createClient();
  const [{ data: requests, error }, { data: companies }] = await Promise.all([
    supabase.from("subscription_requests").select("id, organization_id, kind, details, created_at, resolved_at")
      .order("resolved_at", { ascending: false, nullsFirst: true })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.rpc("platform_admin_list_companies_v2"),
  ]);
  const names = new Map(companies?.map((company) => [company.id, company.name]));
  const date = new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bucharest" });

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <h1 className="text-xl font-extrabold">Solicitări abonamente</h1>
      <p className="text-sm text-muted">Cereri de funcții, upgrade-uri și anulare trimise de companii.</p>
      {error ? <p role="alert" className="text-sm text-danger">Solicitările nu au putut fi încărcate.</p> : !requests?.length && <p className="text-sm text-muted">Nicio solicitare.</p>}
      {requests?.map((request) => (
        <article key={request.id} className="space-y-2 rounded-xl border border-border bg-white p-4">
          <h2 className="font-bold">{request.kind === "cancellation" ? "Anulare abonament" : "Funcție nouă sau upgrade"}</h2>
          <div className="text-sm text-muted">
            <Link className="font-semibold text-electric" href={`/admin/companii/${request.organization_id}`}>
              {names.get(request.organization_id) ?? request.organization_id}
            </Link>
            {" · "}{date.format(new Date(request.created_at))}
          </div>
          <p className="whitespace-pre-wrap break-words text-sm">{request.details}</p>
          {request.resolved_at ? <p className="text-sm text-muted">Procesată</p> : (
            <form action={resolveRequest.bind(null, request.id)}>
              <button className="rounded-lg border border-border px-3 py-2 text-sm font-semibold">Marchează ca procesată</button>
            </form>
          )}
        </article>
      ))}
    </div>
  );
}
