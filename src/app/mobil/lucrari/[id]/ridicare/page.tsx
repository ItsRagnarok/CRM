import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Camera, ChevronRight } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { advanceMobileStage, toggleRequiredItemTaken } from "../actions";
import { StepBadge } from "../step-badge";

export default async function MobileRidicarePage({ params }: { params: Promise<{ id: string }> }) {
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

  const [{ data: requiredItems }, { count: pickupPhotoCount }] = await Promise.all([
    supabase
      .from("job_required_items")
      .select("id, kind, quantity_needed, custom_name, taken, materials(name, unit)")
      .eq("job_id", id)
      .order("created_at"),
    supabase
      .from("photos")
      .select("id", { count: "exact", head: true })
      .eq("job_id", id)
      .eq("category", "depot_pickup"),
  ]);

  const required = requiredItems ?? [];
  const takenCount = required.filter((r) => r.taken).length;
  const hasPickupPhoto = (pickupPhotoCount ?? 0) > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#eaecf0] px-4 py-2.5">
        <Link href="/mobil" className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg">
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <div>
          <div className="text-[15px] font-extrabold">Lucrare #{job.display_number}</div>
          <div className="mt-1"><StepBadge step="ridicare" /></div>
        </div>
      </div>

      {required.length > 0 && (
        <div className="flex-shrink-0 px-4 pb-1.5 pt-3">
          <div className="mb-1.5 flex justify-between text-[12px] text-muted">
            <span>Ridicate</span>
            <b className="text-foreground">
              {takenCount}/{required.length}
            </b>
          </div>
          <div className="h-2 rounded-[6px] bg-neutral-bg">
            <div
              className="h-2 rounded-[6px] bg-electric"
              style={{ width: `${required.length ? (takenCount / required.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        <p className="mb-3 text-[12.5px] text-muted">
          Bifează ce ai ridicat de la depozit. Ce era deja bifat de mai devreme a rămas bifat.
        </p>
        {required.length > 0 ? (
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
        ) : (
          <p className="text-[13px] text-muted">Nimic definit — ridică ce ai nevoie din stocul general al depozitului.</p>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-[#eaecf0] p-4">
        {!hasPickupPhoto ? (
          <Link
            href={`/mobil/lucrari/${id}/foto?cat=depot_pickup`}
            className="flex items-center justify-center gap-2 rounded-[12px] bg-electric py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(47,111,237,0.3)]"
          >
            <Camera className="h-[18px] w-[18px]" /> FĂ POZA CU CE AI RIDICAT
          </Link>
        ) : (
          <>
            <Link
              href={`/mobil/lucrari/${id}/foto?cat=depot_pickup`}
              className="mb-2.5 flex items-center justify-between rounded-[12px] border border-[#eaecf0] bg-white p-3.5"
            >
              <div className="flex items-center gap-2 text-[13px] font-semibold text-success">
                <Camera className="h-4 w-4" /> Poză încărcată — atinge pentru mai multe
              </div>
              <ChevronRight className="h-4 w-4 text-muted-2" />
            </Link>
            <form action={advanceMobileStage}>
              <input type="hidden" name="jobId" value={id} />
              <input type="hidden" name="stage" value="cheltuiala" />
              <button
                type="submit"
                className="block w-full rounded-[12px] bg-success py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(21,128,61,0.28)]"
              >
                CONTINUĂ
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
