import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Store, Camera, Receipt, MapPin } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { uploadPurchasePhoto } from "../../actions";
import { ReturnConfirm } from "./return-confirm";

export default async function AchizitiePage({
  params,
}: {
  params: Promise<{ id: string; requestId: string }>;
}) {
  const { id, requestId } = await params;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, display_number, locations(lat, lng, address)")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!job) notFound();

  const { data: request } = await supabase
    .from("purchase_requests")
    .select("id, quantity, custom_name, store_name, status, fulfilled_at, materials(name, unit)")
    .eq("id", requestId)
    .eq("job_id", id)
    .maybeSingle();
  if (!request || request.status !== "approved") notFound();

  const { count: purchasePhotoCount } = await supabase
    .from("photos")
    .select("id", { count: "exact", head: true })
    .eq("job_id", id)
    .eq("category", "material");

  const itemName = request.materials?.name ?? request.custom_name ?? "—";

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
          <div className="text-[15px] font-extrabold">Achiziție aprobată</div>
          <div className="text-[11.5px] text-muted-2">Lucrare #{job.display_number}</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-[13px] border border-success-bg bg-success-bg p-4">
          <div className="text-[13.5px] font-bold text-success">
            ✓ Aprobat: {itemName} × {request.quantity} {request.materials?.unit ?? "buc"}
          </div>
          {request.store_name ? (
            <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-[#344054]">
              <Store className="h-3.5 w-3.5" /> Cumpără de la: <b>{request.store_name}</b>
            </div>
          ) : (
            <div className="mt-2 text-[12.5px] text-[#344054]">Poți cumpăra de la orice magazin disponibil.</div>
          )}
        </div>

        <div className="mt-4 rounded-[13px] border border-[#eaecf0] bg-white p-4">
          <div className="mb-2.5 flex items-center gap-2 text-[14px] font-bold text-foreground">
            <Camera className="h-4 w-4 text-electric" /> Poze cu produsele cumpărate ({purchasePhotoCount ?? 0})
          </div>
          <form action={uploadPurchasePhoto} className="flex items-center gap-2">
            <input type="hidden" name="jobId" value={id} />
            <input
              type="file"
              name="file"
              accept="image/*"
              capture="environment"
              required
              className="flex-1 text-[12.5px]"
            />
            <button type="submit" className="rounded-[9px] bg-electric px-3.5 py-2 text-[12.5px] font-bold text-white">
              Încarcă
            </button>
          </form>
        </div>

        <Link
          href={`/mobil/lucrari/${id}/cheltuiala`}
          className="mt-4 flex items-center gap-3 rounded-[13px] border border-[#eaecf0] bg-white p-3.5"
        >
          <Receipt className="h-4 w-4 text-electric" />
          <div className="flex-1 text-[13.5px] font-bold">Adaugă bonul / factura de la magazin</div>
        </Link>

        <div className="mt-4 rounded-[13px] border border-[#eaecf0] bg-white p-4">
          <div className="mb-2.5 flex items-center gap-2 text-[14px] font-bold text-foreground">
            <MapPin className="h-4 w-4 text-electric" /> Întoarce-te la adresa lucrării
          </div>
          {job.locations?.address && <p className="mb-3 text-[12.5px] text-muted">{job.locations.address}</p>}
          <ReturnConfirm
            jobId={id}
            requestId={requestId}
            jobLat={job.locations?.lat ?? null}
            jobLng={job.locations?.lng ?? null}
          />
        </div>
      </div>
    </div>
  );
}
