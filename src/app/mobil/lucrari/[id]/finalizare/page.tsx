import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Camera } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addChecklistItem, toggleChecklistItem, ensureChecklist } from "@/app/(app)/lucrari/[id]/actions";
import { pairHours, formatHM } from "@/app/(app)/pontaj/lib";
import { finalizeJob } from "../actions";

export default async function MobileFinalizarePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, display_number, observations, require_final_photo")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!job) notFound();

  const checklistId = await ensureChecklist(supabase, id, "after");
  const [{ data: rawItems }, { count: photoCount }, { count: afterPhotoCount }, { data: expenses }, { data: entries }] = await Promise.all([
    checklistId
      ? supabase
          .from("job_checklist_items")
          .select("id, label, is_checked, sort_order, locked")
          .eq("job_checklist_id", checklistId)
          .order("sort_order")
      : Promise.resolve({ data: [] }),
    supabase.from("photos").select("id", { count: "exact", head: true }).eq("job_id", id),
    supabase.from("photos").select("id", { count: "exact", head: true }).eq("job_id", id).eq("category", "after"),
    supabase.from("expenses").select("amount").eq("job_id", id),
    supabase.from("time_entries").select("profile_id, job_id, event_type, occurred_at").eq("job_id", id),
  ]);

  const hasFinalPhoto = !job.require_final_photo || (afterPhotoCount ?? 0) > 0;

  const items = rawItems ?? [];
  const totalExpenses = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const workedHours = pairHours(entries ?? [], "work_start", "work_end");

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
          <div className="text-[15px] font-extrabold">Finalizare lucrare</div>
          <div className="text-[11.5px] text-muted-2">Checklist final — #{job.display_number}</div>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-auto">
        <div className="flex flex-col gap-2 p-4">
          {items.map((item) => (
            <form
              key={item.id}
              action={toggleChecklistItem}
              className={`flex items-center gap-3 rounded-[12px] p-3.5 ${
                item.is_checked ? "border border-success-bg bg-success-bg" : "border border-[#eaecf0] bg-white"
              }`}
            >
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="jobId" value={id} />
              <input type="hidden" name="isChecked" value={String(item.is_checked)} />
              <button
                type="submit"
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] ${
                  item.is_checked ? "bg-success" : "border-2 border-[#d0d5dd]"
                }`}
              >
                {item.is_checked && <span className="text-[13px] text-white">✓</span>}
              </button>
              <div className={`flex-1 text-[13.5px] font-semibold ${item.is_checked ? "text-muted line-through" : ""}`}>
                {item.label}
              </div>
            </form>
          ))}
        </div>

        <div className="px-4">
          <AddItemForm jobId={id} />
        </div>

        <form action={finalizeJob} className="flex flex-1 flex-col">
        <input type="hidden" name="jobId" value={id} />
        <div className="px-4 pt-4">
          <div className="mb-1.5 text-[12.5px] font-bold text-[#344054]">Observații (opțional)</div>
          <textarea
            name="observations"
            defaultValue={job.observations ?? ""}
            rows={3}
            className="w-full resize-none rounded-[12px] border border-[#d0d5dd] p-3 text-[13.5px] outline-none focus:border-electric"
          />
        </div>

        <div className="px-4 pt-3">
          <div className="mb-1.5 text-[12.5px] font-bold text-[#344054]">Defecțiuni scule/echipamente (dacă au fost)</div>
          <textarea
            name="equipmentIssue"
            rows={2}
            placeholder="Lasă gol dacă nu au fost probleme"
            className="w-full resize-none rounded-[12px] border border-[#d0d5dd] p-3 text-[13.5px] outline-none focus:border-electric"
          />
        </div>

        <div className="mx-4 mt-4 rounded-[12px] border border-[#eaecf0] bg-neutral-bg p-3.5 text-[12.5px] leading-relaxed text-muted">
          <b className="text-foreground">Rezumat:</b> {formatHM(workedHours)} lucrate · {photoCount ?? 0} fotografii ·{" "}
          {totalExpenses.toFixed(2)} RON cheltuieli · checklist {items.length ? Math.round((items.filter(i=>i.is_checked).length/items.length)*100) : 0}% complet
        </div>

        <div className="flex-1" />

        {!hasFinalPhoto && (
          <div className="mx-4 mb-3 flex items-center gap-3 rounded-[12px] border border-warning-bg bg-warning-bg p-3.5">
            <Camera className="h-5 w-5 shrink-0 text-warning" />
            <div className="flex-1 text-[12.5px] font-semibold text-[#7a5b0e]">
              Ai nevoie de o poză la lucrarea finalizată înainte să poți încheia.
            </div>
          </div>
        )}

        <div className="p-4">
          {hasFinalPhoto ? (
            <button
              type="submit"
              className="block w-full rounded-[12px] bg-success py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(21,128,61,0.28)]"
            >
              FINALIZEAZĂ LUCRAREA
            </button>
          ) : (
            <Link
              href={`/mobil/lucrari/${id}/foto?cat=after`}
              className="flex items-center justify-center gap-2 rounded-[12px] bg-electric py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(47,111,237,0.3)]"
            >
              <Camera className="h-[18px] w-[18px]" /> FĂ POZA FINALĂ
            </Link>
          )}
        </div>
        </form>
      </div>
    </div>
  );
}

function AddItemForm({ jobId }: { jobId: string }) {
  return (
    <form action={addChecklistItem} className="flex gap-2">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="phase" value="after" />
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
  );
}
