import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addExpense } from "@/app/(app)/lucrari/[id]/actions";
import { MissingItemsFlow } from "./missing-items-flow";
import { StepBadge } from "../step-badge";

export default async function MobileExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, display_number")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!job) notFound();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, category, vendor, amount, receipt_path, created_at")
    .eq("job_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#eaecf0] px-4 py-2.5">
        <Link
          href="/mobil"
          className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg"
        >
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <div>
          <div className="text-[15px] font-extrabold">Lucrare #{job.display_number}</div>
          <div className="mt-1"><StepBadge step="cheltuiala" /></div>
        </div>
      </div>

      <MissingItemsFlow jobId={id} expenses={expenses ?? []} addExpense={addExpense} />
    </div>
  );
}
