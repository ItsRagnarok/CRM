import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Warehouse } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { advanceMobileStage } from "../actions";
import { DepotNavigateButton } from "./depot-navigate-button";

export default async function MobileDepotPage({ params }: { params: Promise<{ id: string }> }) {
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

  const hasDepot = organization.hq_lat != null && organization.hq_lng != null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#eaecf0] px-4 py-2.5">
        <Link
          href="/mobil"
          className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg"
        >
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <div className="text-[15px] font-extrabold">Lucrare #{job.display_number}</div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-electric-soft">
          <Warehouse className="h-7 w-7 text-electric" strokeWidth={1.8} />
        </div>
        <div>
          <div className="text-[16px] font-extrabold text-foreground">Ai nevoie să treci pe la depozit?</div>
          <div className="mt-1.5 text-[13px] text-muted">
            Dacă nu ai deja materialele și sculele de mai devreme în mașină, treci pe la depozitul central să le
            ridici.
          </div>
        </div>

        <div className="mt-2 flex w-full flex-col gap-2.5">
          <form action={advanceMobileStage} className="w-full">
            <input type="hidden" name="jobId" value={id} />
            <input type="hidden" name="stage" value="cheltuiala" />
            <button
              type="submit"
              className="block w-full rounded-[12px] bg-electric py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(47,111,237,0.3)]"
            >
              AM DEJA MATERIALELE ÎN MAȘINĂ
            </button>
          </form>

          {hasDepot ? (
            <DepotNavigateButton jobId={id} lat={organization.hq_lat!} lng={organization.hq_lng!} />
          ) : (
            <Link
              href="#"
              className="pointer-events-none block w-full rounded-[12px] border border-[#d0d5dd] py-[14px] text-center text-[14.5px] font-extrabold text-muted-2"
            >
              Depozitul nu are adresă setată încă
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
