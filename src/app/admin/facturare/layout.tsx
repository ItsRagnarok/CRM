import { SyncPanel } from "./sync-panel";
import { BillingNav } from "./nav";
import { billingDb } from "@/lib/billing/store";
export default async function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const db = await billingDb();
  const { data: connection, error } = await db
    .from("billing_oblio_connections")
    .select("enabled")
    .eq("company_id", 1)
    .maybeSingle();
  if (error) throw new Error("Conexiunea Oblio nu a putut fi verificată.");
  return (
    <div className="mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-8">
      <BillingNav />
      {connection?.enabled && <SyncPanel />}
      {children}
    </div>
  );
}
