import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Warehouse } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MobileMapLoader } from "@/components/mobile-map-loader";

export default async function MobileDepotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, display_number, warehouse_id")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!job) notFound();

  // Use the depot the admin explicitly assigned to this job; if none was
  // picked, fall back to the organization's central depot.
  const { data: warehouse } = job.warehouse_id
    ? await supabase.from("warehouses").select("id, name, address, lat, lng").eq("id", job.warehouse_id).maybeSingle()
    : await supabase
        .from("warehouses")
        .select("id, name, address, lat, lng")
        .eq("organization_id", organization.id)
        .eq("is_central", true)
        .maybeSingle();

  const depotPin =
    warehouse && warehouse.lat != null && warehouse.lng != null
      ? {
          id: warehouse.id,
          label: `🏭 ${warehouse.name}`,
          sublabel: warehouse.address ?? "",
          lat: warehouse.lat,
          lng: warehouse.lng,
          href: `/mobil/lucrari/${id}/depozit`,
        }
      : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#eaecf0] px-4 py-2.5">
        <Link href="/mobil" className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg">
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <div>
          <div className="text-[15px] font-extrabold">Lucrare #{job.display_number}</div>
          <div className="text-[11.5px] text-muted-2">Ridicare de la depozit</div>
        </div>
      </div>

      {!warehouse ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <Warehouse className="h-8 w-8 text-muted-2" strokeWidth={1.6} />
          <div className="text-[13.5px] font-semibold text-muted">
            Niciun depozit configurat încă — cere administratorului să adauge unul din Materiale.
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-auto">
          <div className="mx-4 mt-3 flex items-center gap-3 rounded-[13px] border border-[#eaecf0] bg-white p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-electric-soft">
              <Warehouse className="h-[18px] w-[18px] text-electric" strokeWidth={1.9} />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-extrabold text-foreground">{warehouse.name}</div>
              <div className="text-[12px] text-muted">{warehouse.address ?? "Adresă neconfigurată"}</div>
            </div>
          </div>

          {depotPin ? (
            <div className="relative mt-3 flex-1 overflow-hidden">
              <MobileMapLoader jobs={[depotPin]} routeTo={depotPin} />
            </div>
          ) : (
            <div className="mx-4 mt-3 rounded-[12px] border border-warning-bg bg-warning-bg p-3.5 text-center text-[12.5px] font-semibold text-[#7a5b0e]">
              Depozitul nu are coordonate GPS setate — adaugă adresa din platformă ca să apară harta și navigarea.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
