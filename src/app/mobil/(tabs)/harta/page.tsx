import Link from "next/link";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MobileMapLoader } from "@/components/mobile-map-loader";
import type { MobileMapJob } from "@/components/mobile-map";
import { todayInOrgTimeZone } from "@/lib/date";

export default async function MobileMapPage() {
  const { profile, organization } = await requireSessionContext();
  const supabase = await createClient();
  const today = todayInOrgTimeZone();

  const [{ data: assignments }, { data: warehouses }, { data: trailLog }] = await Promise.all([
    supabase
      .from("job_assignments")
      .select(
        "jobs(id, display_number, title, status, scheduled_date, start_time, clients(name), locations(address, lat, lng))"
      )
      .eq("profile_id", profile.id),
    supabase.from("warehouses").select("id, name, address, lat, lng").eq("organization_id", organization.id),
    // Same 12h window as the admin map — his own route since the trail
    // resumed (it pauses automatically while he's on-site working).
    supabase
      .from("technician_position_log")
      .select("lat, lng, recorded_at")
      .eq("organization_id", organization.id)
      .eq("profile_id", profile.id)
      .gte("recorded_at", new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
      .order("recorded_at", { ascending: true }),
  ]);

  // Every open job gets a pin, not just today's — a technician should see
  // his whole upcoming workload on the map, not just what's scheduled now.
  const jobs = (assignments ?? [])
    .map((a) => a.jobs)
    .filter(
      (j): j is NonNullable<typeof j> => Boolean(j) && j!.status !== "finalizata" && j!.status !== "anulata"
    )
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date) || (a.start_time ?? "").localeCompare(b.start_time ?? ""));

  const mapJobs: MobileMapJob[] = jobs
    .filter((j) => j.locations?.lat != null && j.locations?.lng != null)
    .map((j) => ({
      id: j.id,
      label: `#${j.display_number}`,
      sublabel: `${j.clients?.name ?? "Client"} · ${j.title}`,
      lat: j.locations!.lat!,
      lng: j.locations!.lng!,
      href: `/mobil/lucrari/${j.id}`,
    }));

  const nextJob = jobs.find((j) => j.scheduled_date === today) ?? jobs[0] ?? null;
  const routeTo = nextJob ? mapJobs.find((j) => j.id === nextJob.id) : undefined;
  const hq =
    organization.hq_lat != null && organization.hq_lng != null
      ? { lat: organization.hq_lat, lng: organization.hq_lng }
      : null;
  const warehouseMarkers = (warehouses ?? [])
    .filter((w) => w.lat != null && w.lng != null)
    .map((w) => ({ id: w.id, name: w.name, lat: w.lat!, lng: w.lng! }));
  const trail: [number, number][] = (trailLog ?? []).map((p) => [p.lat, p.lng]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 border-b border-[#eaecf0] bg-white px-5 pb-3 pt-1.5">
        <div className="text-[19px] font-extrabold">Harta mea</div>
        <div className="mt-0.5 text-[12.5px] text-muted">Toate lucrările tale nefinalizate</div>
      </div>

      <div className="relative flex-1">
        {/* The map itself — your own position, HQ/depot, trail — is always
            worth showing, even on a day with no jobs assigned. */}
        <MobileMapLoader jobs={mapJobs} routeTo={routeTo} hq={hq} warehouses={warehouseMarkers} trail={trail} />
        {mapJobs.length === 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-4">
            <div className="rounded-[10px] bg-white/95 px-3.5 py-2 text-[12px] font-semibold text-muted shadow-[0_4px_14px_rgba(16,24,40,0.12)]">
              Nicio lucrare cu adresă GPS momentan
            </div>
          </div>
        )}
      </div>

      {routeTo && (
        <div className="mx-4 mt-3 flex flex-shrink-0 gap-2.5">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${routeTo.lat},${routeTo.lng}&travelmode=driving`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-[10px] bg-neutral-bg py-2.5 text-center text-[12.5px] font-bold text-[#344054]"
          >
            Google Maps
          </a>
          <a
            href={`https://waze.com/ul?ll=${routeTo.lat},${routeTo.lng}&navigate=yes`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-[10px] bg-neutral-bg py-2.5 text-center text-[12.5px] font-bold text-[#344054]"
          >
            Waze
          </a>
        </div>
      )}

      {nextJob && (
        <Link
          href={`/mobil/lucrari/${nextJob.id}`}
          className="mx-4 my-3.5 flex flex-shrink-0 items-center gap-3 rounded-[14px] border border-[#eaecf0] bg-white p-3.5 shadow-[0_6px_18px_rgba(16,24,40,0.08)]"
        >
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-electric-soft">
            📍
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold text-muted-2">
              URMĂTOAREA LUCRARE{nextJob.start_time ? ` · ${nextJob.start_time.slice(0, 5)}` : ""}
            </div>
            <div className="text-[13.5px] font-extrabold">{nextJob.clients?.name ?? "Client"}</div>
          </div>
          <div className="rounded-[9px] bg-electric px-3.5 py-2 text-[11.5px] font-bold text-white">Detalii</div>
        </Link>
      )}
    </div>
  );
}
