import Link from "next/link";
import { notFound } from "next/navigation";
import { billingDb } from "@/lib/billing/store";
import { ClientForm } from "../../forms";
export default async function EditBillingClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await billingDb();
  const { data, error } = await db
    .from("billing_clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Clientul nu a putut fi încărcat.");
  if (!data) notFound();
  return (
    <div>
      <Link
        href="/admin/facturare/clienti"
        className="text-sm font-semibold text-purple"
      >
        ← Clienți
      </Link>
      <section className="mt-5 rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-5 text-lg font-bold">{data.name ?? data.cui}</h2>
        <ClientForm client={data} />
        <Link
          href={`/admin/facturare/facturi/noua?client=${id}`}
          className="mt-6 inline-block rounded-xl bg-purple px-5 py-3 text-sm font-bold text-white"
        >
          Factură pentru acest client →
        </Link>
      </section>
    </div>
  );
}
