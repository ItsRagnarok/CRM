import Link from "next/link";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MobileMapLoader } from "@/components/mobile-map-loader";
import type { MobileMapJob } from "@/components/mobile-map";
import { EmptyState } from "@/components/empty-state";
import { MapPin } from "lucide-react";

export default async function MobileMapPage() {
  const { profile } = await requireSessionContext();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: assignments } = await supabase
    .from("job_assignments")
    .select(
      "jobs(id, display_number, title, status, scheduled_date, start_time, clients(name), locations(address, lat, lng))"
    )
    .eq("profile_id", profile.id);

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

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 border-b border-[#eaecf0] bg-white px-5 pb-3 pt-1.5">
        <div className="text-[19px] font-extrabold">Harta mea</div>
        <div className="mt-0.5 text-[12.5px] text-muted">Toate lucrările tale nefinalizate</div>
      </div>

      <div className="relative flex-1">
        {mapJobs.length > 0 ? (
          <MobileMapLoader jobs={mapJobs} routeTo={routeTo} />
        ) : (
          <EmptyState icon={MapPin} title="Nimic de afișat" description="Nu ai lucrări cu adresă GPS azi." />
        )}
      </div>

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
