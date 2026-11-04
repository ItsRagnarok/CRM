import { createClient } from "@/lib/supabase/server";
import { SubscriptionRequestForm } from "./subscription-request-form";

export async function SubscriptionRequests({ organizationId }: { organizationId: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("subscription_requests")
    .select("id, kind, details, created_at, resolved_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <section className="rounded-[13px] border border-border bg-white p-[22px]">
      <h2 className="text-[15px] font-bold text-foreground">Solicitări</h2>
      <p className="mb-4 mt-1 text-sm text-muted">Funcțiile noi și adaptările se tarifează separat, pe baza unei oferte pe care o poți aproba înainte de implementare.</p>
      {error ? <p role="alert" className="text-sm text-danger">Solicitările nu sunt disponibile momentan.</p> : <SubscriptionRequestForm />}
      {!!data?.length && (
        <ul className="mt-5 divide-y divide-border border-t border-border">
          {data.map((request) => (
            <li key={request.id} className="py-3 text-sm">
              <p className="font-semibold">{request.kind === "cancellation" ? "Anulare abonament" : "Funcție nouă sau upgrade"} · {request.resolved_at ? "Procesată" : "În așteptare"}</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-muted">{request.details}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
