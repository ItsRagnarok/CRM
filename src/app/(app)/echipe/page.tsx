import Link from "next/link";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { ROLE_LABELS } from "@/lib/auth";
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES } from "@/lib/status";
import { UsersRound, Plus, Truck } from "lucide-react";
import { reassignVehicle, setVehicleDriver } from "./actions";

const AVATAR_PALETTE = [
  { bg: "#EFF4FF", text: "#2F6FED" },
  { bg: "#F5F3FF", text: "#6D28D9" },
  { bg: "#FEF9EC", text: "#B45309" },
  { bg: "#F0FDF4", text: "#15803D" },
  { bg: "#F2F4F7", text: "#475467" },
];

export default async function EchipePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { organization } = await requireSessionContext();
  const { tab: rawTab } = await searchParams;
  const tab = rawTab === "vehicule" ? "vehicule" : "echipe";
  const supabase = await createClient();

  const { data: teams } = await supabase
    .from("teams")
    .select(
      "id, name, is_active, leader:profiles!teams_team_leader_id_fkey(id, full_name), team_members(profile_id, profiles(id, full_name, role))"
    )
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: true });

  const { data: vehicles } =
    tab === "vehicule"
      ? await supabase
          .from("vehicles")
          .select("id, name, plate_number, is_active, assigned_team_id, driver_id, teams(id, name)")
          .eq("organization_id", organization.id)
          .order("name")
      : { data: null };

  const teamIds = (teams ?? []).map((t) => t.id);
  const todayStr = new Date().toISOString().slice(0, 10);

  const { data: jobs } = teamIds.length
    ? await supabase
        .from("jobs")
        .select("id, display_number, title, status, scheduled_date, start_time, team_id, locations(address)")
        .eq("organization_id", organization.id)
        .in("team_id", teamIds)
        .gte("scheduled_date", todayStr)
        .order("scheduled_date", { ascending: true })
        .order("start_time", { ascending: true, nullsFirst: false })
    : { data: [] as never[] };

  const initials = (name: string) =>
    name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[17px] font-extrabold text-foreground">Echipe</h1>
        <div className="flex gap-0.5 rounded-[9px] bg-neutral-bg p-[3px]">
          <Link
            href="/echipe"
            className={`rounded-[7px] px-3.5 py-1.5 text-[12.5px] font-bold ${
              tab === "echipe" ? "bg-white text-foreground shadow-sm" : "text-muted"
            }`}
          >
            Echipe
          </Link>
          <Link
            href="/echipe?tab=vehicule"
            className={`rounded-[7px] px-3.5 py-1.5 text-[12.5px] font-bold ${
              tab === "vehicule" ? "bg-white text-foreground shadow-sm" : "text-muted"
            }`}
          >
            Vehicule
          </Link>
        </div>
        <div className="flex-1" />
        {tab === "echipe" && (
          <Link
            href="/echipe/noua"
            className="flex items-center gap-1.5 rounded-[10px] bg-electric px-4 py-2.5 text-[13.5px] font-bold text-white"
          >
            <Plus className="h-4 w-4" /> Echipă nouă
          </Link>
        )}
      </div>

      {tab === "vehicule" ? (
        vehicles && vehicles.length > 0 ? (
          <div className="overflow-hidden rounded-[13px] border border-border bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f9fafb] text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">Vehicul</th>
                  <th className="px-5 py-3">Nr. înmatriculare</th>
                  <th className="px-5 py-3">Alocat echipei</th>
                  <th className="px-5 py-3">Șofer</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="border-t border-[#f2f4f7]">
                    <td className="px-5 py-3.5 text-[13.5px] font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted" />
                        {v.name}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-muted">{v.plate_number ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <form action={reassignVehicle} className="flex items-center gap-2">
                        <input type="hidden" name="vehicleId" value={v.id} />
                        <select
                          name="teamId"
                          defaultValue={v.assigned_team_id ?? ""}
                          className="rounded-[8px] border border-[#d0d5dd] px-2.5 py-1.5 text-[12.5px] font-semibold outline-none focus:border-electric"
                        >
                          <option value="">Neasignat</option>
                          {(teams ?? []).map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="text-[11px] font-bold text-electric">
                          Salvează
                        </button>
                      </form>
                    </td>
                    <td className="px-5 py-3.5">
                      <form action={setVehicleDriver} className="flex items-center gap-2">
                        <input type="hidden" name="vehicleId" value={v.id} />
                        <select
                          name="driverId"
                          defaultValue={v.driver_id ?? ""}
                          className="rounded-[8px] border border-[#d0d5dd] px-2.5 py-1.5 text-[12.5px] font-semibold outline-none focus:border-electric"
                        >
                          <option value="">Nesetat</option>
                          {((teams ?? []).find((t) => t.id === v.assigned_team_id)?.team_members ?? []).map((m) => (
                            <option key={m.profile_id} value={m.profile_id}>
                              {m.profiles?.full_name ?? "—"}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="text-[11px] font-bold text-electric">
                          Salvează
                        </button>
                      </form>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge
                        label={v.is_active ? "Activ" : "Inactiv"}
                        className={v.is_active ? "bg-success-bg text-success" : "bg-neutral-bg text-neutral"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Truck}
            title="Niciun vehicul încă"
            description="Adaugă vehicule din pagina fiecărei echipe."
          />
        )
      ) : teams && teams.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const members = team.team_members;
            const teamJobs = (jobs ?? []).filter((j) => j.team_id === team.id);
            const inProgress = ["in_lucru", "in_drum", "ajunsa"] as const;
            const done = ["finalizata", "anulata"] as const;
            const current = teamJobs.find((j) => inProgress.includes(j.status as (typeof inProgress)[number]));
            const next = current
              ? undefined
              : teamJobs.find((j) => !done.includes(j.status as (typeof done)[number]));
            const job = current ?? next;

            return (
              <Link
                key={team.id}
                href={`/echipe/${team.id}`}
                prefetch={false}
                className="flex flex-col rounded-[13px] border border-border bg-white p-[18px] hover:border-electric"
              >
                <div className="flex items-center justify-between">
                  <div className="text-[15px] font-bold text-foreground">{team.name}</div>
                  {job ? (
                    <StatusBadge
                      label={JOB_STATUS_LABELS[job.status]}
                      className={JOB_STATUS_STYLES[job.status]}
                    />
                  ) : (
                    <StatusBadge
                      label={team.is_active ? "Disponibil" : "Inactivă"}
                      className={
                        team.is_active
                          ? "bg-success-bg text-success"
                          : "bg-neutral-bg text-neutral"
                      }
                    />
                  )}
                </div>

                {members.length > 0 ? (
                  <div className="mt-3.5 flex flex-col gap-2.5">
                    {members.map((m, i) => {
                      const palette = AVATAR_PALETTE[i % AVATAR_PALETTE.length];
                      return (
                        <div key={m.profile_id} className="flex items-center gap-2.5">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                            style={{ background: palette.bg, color: palette.text }}
                          >
                            {m.profiles?.full_name ? initials(m.profiles.full_name) : "?"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-bold text-foreground">
                              {m.profiles?.full_name}
                            </div>
                            <div className="text-[11.5px] text-muted-2">
                              {m.profiles ? ROLE_LABELS[m.profiles.role] : "—"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3.5 text-[12.5px] text-muted">Fără membri încă.</p>
                )}

                <div className="mt-3.5 border-t border-[#f2f4f7] pt-3.5">
                  {job ? (
                    <>
                      <div className="text-[11.5px] font-semibold text-muted-2">
                        {current ? "LUCRARE CURENTĂ" : "URMĂTOAREA LUCRARE"}
                      </div>
                      <div className="text-[13px] font-bold text-electric">
                        #{job.display_number} — {job.title}
                      </div>
                      <div className="mt-0.5 text-[12px] text-muted">
                        {!current && job.start_time ? `${job.start_time.slice(0, 5)} · ` : ""}
                        {job.locations?.address ?? job.scheduled_date}
                      </div>
                    </>
                  ) : (
                    <p className="text-[12px] text-muted-2">
                      Fără lucrare activă — disponibil pentru alocare
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={UsersRound}
          title="Nicio echipă încă"
          description="Creează prima echipă pentru a putea dispeceriza lucrări către ea."
          action={
            <Link
              href="/echipe/noua"
              className="mt-1 flex items-center gap-1.5 rounded-[9px] bg-electric px-4 py-2 text-[13px] font-bold text-white"
            >
              <Plus className="h-4 w-4" /> Echipă nouă
            </Link>
          }
        />
      )}
    </div>
  );
}
