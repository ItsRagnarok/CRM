import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ensureChecklist, toggleChecklistItem } from "@/app/(app)/lucrari/[id]/actions";
import { advanceMobileStage, toggleRequiredItemTaken } from "../actions";

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

  const checklistId = await ensureChecklist(supabase, id, "before");
  const [{ data: rawItems }, { data: requiredItems }] = await Promise.all([
    checklistId
      ? supabase
          .from("job_checklist_items")
          .select("id, label, is_checked, sort_order, locked")
          .eq("job_checklist_id", checklistId)
          .order("sort_order")
      : Promise.resolve({ data: [] }),
    supabase
      .from("job_required_items")
      .select("id, kind, quantity_needed, custom_name, taken, materials(name, unit)")
      .eq("job_id", id)
      .order("created_at"),
  ]);

  const items = rawItems ?? [];
  const required = requiredItems ?? [];
  const takenCount = required.filter((r) => r.taken).length;
  const totalCount = required.length + items.length;
  const doneCount = takenCount + items.filter((i) => i.is_checked).length;

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
          <div className="text-[11.5px] text-muted-2">Checklist înainte de plecare</div>
        </div>
      </div>

      {totalCount > 0 && (
        <div className="flex-shrink-0 px-4 pb-1.5 pt-3">
          <div className="mb-1.5 flex justify-between text-[12px] text-muted">
            <span>Progres</span>
            <b className="text-foreground">
              {doneCount}/{totalCount}
            </b>
          </div>
          <div className="h-2 rounded-[6px] bg-neutral-bg">
            <div
              className="h-2 rounded-[6px] bg-electric"
              style={{ width: `${totalCount ? (doneCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        {required.length > 0 ? (
          <>
            <div className="mb-2 text-[12px] font-bold text-muted-2">MATERIALE ȘI SCULE DE LUAT</div>
            <div className="flex flex-col gap-2.5">
              {required.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-[12px] p-3.5 ${
                    item.taken ? "border border-success-bg bg-success-bg" : "border border-[#eaecf0] bg-white"
                  }`}
                >
                  <form action={toggleRequiredItemTaken}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="jobId" value={id} />
                    <input type="hidden" name="taken" value={String(item.taken)} />
                    <button
                      type="submit"
                      className={`flex h-6 w-6 items-center justify-center rounded-[7px] ${
                        item.taken ? "bg-success" : "border-2 border-[#d0d5dd]"
                      }`}
                    >
                      {item.taken && <span className="text-[13px] text-white">✓</span>}
                    </button>
                  </form>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      item.kind === "tool" ? "bg-purple-soft text-purple" : "bg-electric-soft text-electric"
                    }`}
                  >
                    {item.kind === "tool" ? "SCULĂ" : "MATERIAL"}
                  </span>
                  <div className={`flex-1 text-[14px] font-semibold ${item.taken ? "text-muted line-through" : ""}`}>
                    {item.materials?.name ?? item.custom_name}
                  </div>
                  <div className="text-[12px] font-bold text-muted-2">
                    {item.quantity_needed} {item.materials?.unit ?? "buc"}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="mb-4 text-[13px] text-muted">
            Administratorul nu a definit materiale/scule specifice pentru lucrarea asta — ia stocul general din
            mașină.
          </p>
        )}

        {items.length > 0 && (
          <>
            <div className="mb-2 mt-5 text-[12px] font-bold text-muted-2">ALTE VERIFICĂRI</div>
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
                  {item.locked && <span className="text-[10.5px] font-semibold text-muted-2">stabilit de admin</span>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-[#eaecf0] p-4">
        <form action={advanceMobileStage}>
          <input type="hidden" name="jobId" value={id} />
          <input type="hidden" name="stage" value="depozit" />
          <button
            type="submit"
            className="block w-full rounded-[12px] bg-electric py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(47,111,237,0.3)]"
          >
            MAI DEPARTE
          </button>
        </form>
      </div>
    </div>
  );
}
