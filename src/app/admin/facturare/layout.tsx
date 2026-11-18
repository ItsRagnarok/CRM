import { BillingNav } from "./nav";
import { billingDb } from "@/lib/billing/store";

export default async function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await billingDb();
  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-wide text-purple">
        Super Admin ElectroField
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Facturare</h1>
      <BillingNav />
      {children}
    </div>
  );
}
