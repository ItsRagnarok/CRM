import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addExpense } from "@/app/(app)/lucrari/[id]/actions";

const CATEGORIES = ["materiale", "combustibil", "parcare", "unelte"];
const CATEGORY_LABELS: Record<string, string> = {
  materiale: "Materiale",
  combustibil: "Combustibil",
  parcare: "Parcare",
  unelte: "Unelte",
};

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

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#eaecf0] px-4 py-2.5">
        <Link
          href={`/mobil/lucrari/${id}`}
          className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg"
        >
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <div className="text-[15px] font-extrabold">Cheltuială — #{job.display_number}</div>
      </div>

      <form action={addExpense} className="flex flex-1 flex-col overflow-auto p-4">
        <input type="hidden" name="jobId" value={id} />

        <Field label="Magazin / furnizor">
          <input
            name="vendor"
            placeholder="Ex: Leroy Merlin"
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-[14px] outline-none focus:border-electric"
          />
        </Field>

        <Field label="Sumă (RON)">
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-[14px] font-bold outline-none focus:border-electric"
          />
        </Field>

        <div className="mt-1">
          <div className="mb-2 text-[12px] font-semibold text-[#344054]">Categorie</div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c, i) => (
              <label key={c} className="cursor-pointer">
                <input type="radio" name="category" value={c} defaultChecked={i === 0} className="peer sr-only" />
                <span className="rounded-full bg-neutral-bg px-3.5 py-2 text-[12.5px] font-semibold text-[#475467] peer-checked:bg-electric peer-checked:text-white">
                  {CATEGORY_LABELS[c]}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex-1" />

        <button
          type="submit"
          className="mt-6 block w-full rounded-[12px] bg-electric py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(47,111,237,0.3)]"
        >
          SALVEAZĂ CHELTUIALA
        </button>
      </form>

      <div className="flex-shrink-0 border-t border-[#eaecf0] p-4">
        <div className="mb-2 text-center text-[11.5px] text-muted-2">Cheltuiala e opțională — poți continua fără</div>
        <Link
          href={`/mobil/lucrari/${id}/finalizare`}
          className="block rounded-[12px] bg-neutral-bg py-[14px] text-center text-[14.5px] font-extrabold text-[#344054]"
        >
          CONTINUĂ
        </Link>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 text-[12px] font-semibold text-[#344054]">{label}</div>
      {children}
    </div>
  );
}
