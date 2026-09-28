import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addChecklistItem, toggleChecklistItem, deleteChecklistItem } from "@/app/(app)/lucrari/[id]/actions";

export default async function MobileChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, display_number, title")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!job) notFound();

  const { data: checklist } = await supabase
    .from("job_checklists")
    .select("id, job_checklist_items(id, label, is_checked, sort_order)")
    .eq("job_id", id)
    .eq("phase", "before")
    .maybeSingle();

  const items = (checklist?.job_checklist_items ?? []).sort((a, b) => a.sort_order - b.sort_order);
  const doneCount = items.filter((i) => i.is_checked).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#eaecf0] px-4 py-2.5">
        <Link
          href={`/mobil/lucrari/${id}`}
          className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg"
        >
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <div>
          <div className="text-[15px] font-extrabold">Lucrare #{job.display_number}</div>
          <div className="text-[11.5px] text-muted-2">Checklist înainte de start</div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="flex-shrink-0 px-4 pb-1.5 pt-3">
          <div className="mb-1.5 flex justify-between text-[12px] text-muted">
            <span>Progres</span>
            <b className="text-foreground">
              {doneCount}/{items.length}
            </b>
          </div>
          <div className="h-2 rounded-[6px] bg-neutral-bg">
            <div
              className="h-2 rounded-[6px] bg-electric"
              style={{ width: `${items.length ? (doneCount / items.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 rounded-[12px] p-3.5 ${
                item.is_checked ? "border border-success-bg bg-success-bg" : "border border-[#eaecf0] bg-white"
              }`}
            >
              <form action={toggleChecklistItem}>
                <input type="hidden" name="itemId" value={item.id} />
                <input type="hidden" name="jobId" value={id} />
                <input type="hidden" name="isChecked" value={String(item.is_checked)} />
                <button
                  type="submit"
                  className={`flex h-6 w-6 items-center justify-center rounded-[7px] ${
                    item.is_checked ? "bg-success" : "border-2 border-[#d0d5dd]"
                  }`}
                >
                  {item.is_checked && <span className="text-[13px] text-white">✓</span>}
                </button>
              </form>
              <div className={`flex-1 text-[14px] font-semibold ${item.is_checked ? "text-muted line-through" : ""}`}>
                {item.label}
              </div>
              <form action={deleteChecklistItem}>
                <input type="hidden" name="itemId" value={item.id} />
                <input type="hidden" name="jobId" value={id} />
                <button type="submit" className="text-[11px] font-bold text-danger">
                  Șterge
                </button>
              </form>
            </div>
          ))}
        </div>

        <form action={addChecklistItem} className="mt-3 flex gap-2">
          <input type="hidden" name="jobId" value={id} />
          <input type="hidden" name="phase" value="before" />
          <input
            name="label"
            required
            placeholder="Adaugă un item…"
            className="flex-1 rounded-[10px] border border-[#d0d5dd] px-3 py-2.5 text-[13.5px] outline-none focus:border-electric"
          />
          <button type="submit" className="rounded-[10px] bg-neutral-bg px-3.5">
            <Plus className="h-4 w-4 text-[#344054]" />
          </button>
        </form>
      </div>

      <div className="flex-shrink-0 border-t border-[#eaecf0] p-4">
        <Link
          href={`/mobil/lucrari/${id}`}
          className="block rounded-[12px] bg-electric py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(47,111,237,0.3)]"
        >
          CONTINUĂ
        </Link>
      </div>
    </div>
  );
}
