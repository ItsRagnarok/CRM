import { BillingNav } from "./nav";
import { billingDb } from "@/lib/billing/store";
export default async function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await billingDb();
  return (
    <div className="mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-8">
      <BillingNav />
      {children}
    </div>
  );
}
