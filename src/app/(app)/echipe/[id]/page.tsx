import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { ROLE_LABELS } from "@/lib/auth";
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES } from "@/lib/status";
import {
  addMember,
  addVehicle,
  removeMember,
  removeVehicle,
  setTeamLeader,
  toggleTeamActive,
} from "../actions";
import {
  ArrowLeft,
  Crown,
  Plus,
  Power,
  Trash2,
  Truck,
  UserRound,
} from "lucide-react";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select(
      "*, leader:profiles!teams_team_leader_id_fkey(id, full_name), team_members(profile_id, profiles(id, full_name, role)), vehicles(id, name, plate_number)"
    )
    .eq("organization_id", organization.id)
    .eq("id", id)
    .maybeSingle();

  if (!team) notFound();

  const memberIds = new Set(team.team_members.map((m) => m.profile_id));

  const [{ data: availableProfiles }, { data: jobs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .neq("role", "client")
      .order("full_name"),
    supabase
      .from("jobs")
      .select("id, display_number, title, status, scheduled_date, clients(name)")
      .eq("organization_id", organization.id)
      .eq("team_id", id)
      .order("scheduled_date", { ascending: false })
      .limit(15),
  ]);

  const assignableProfiles = (availableProfiles ?? []).filter(
    (p) => !memberIds.has(p.id)
  );

  const initials = (name: string) =>
    name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center gap-3">
        <Link
          href="/echipe"
          className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg"
        >
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <span className="text-[13.5px] text-muted-2">Echipe /</span>
        <span className="text-[15px] font-bold text-foreground">{team.name}</span>
      </div>

      <div className="flex items-center justify-between rounded-[14px] border border-border bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-electric-soft text-[18px] font-extrabold text-electric">
            {initials(team.name)}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="text-[20px] font-extrabold text-foreground">
                {team.name}
              </div>
              <StatusBadge
                label={team.is_active ? "Activă" : "Inactivă"}
                className={
                  team.is_active
                    ? "bg-success-bg text-success"
                    : "bg-neutral-bg text-neutral"
                }
              />
            </div>
            {team.leader?.full_name && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[#475467]">
                <Crown className="h-3.5 w-3.5 text-warning" /> Lider: {team.leader.full_name}
              </div>
            )}
          </div>
        </div>
        <form action={toggleTeamActive}>
          <input type="hidden" name="teamId" value={team.id} />
          <input type="hidden" name="currentStatus" value={String(team.is_active)} />
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-[13px] font-bold text-[#344054]"
          >
            <Power className="h-3.5 w-3.5" />
            {team.is_active ? "Dezactivează" : "Activează"}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[13px] border border-border bg-white">
          <div className="border-b border-[#f2f4f7] px-5 py-3.5 text-[14.5px] font-bold text-foreground">
            Membri echipă
          </div>
          <div className="flex flex-col gap-2 p-5">
            {team.team_members.length > 0 ? (
              <div className="flex flex-col divide-y divide-[#f2f4f7]">
                {team.team_members.map((m) => {
                  const isLeader = m.profile_id === team.leader?.id;
                  return (
                    <div key={m.profile_id} className="flex items-center gap-3 py-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-electric-soft text-[11px] font-bold text-electric">
                        {m.profiles?.full_name ? initials(m.profiles.full_name) : "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 truncate text-[13px] font-semibold text-foreground">
                          {m.profiles?.full_name}
                          {isLeader && <Crown className="h-3 w-3 shrink-0 text-warning" />}
                        </div>
                        <div className="truncate text-[12px] text-muted-2">
                          {m.profiles ? ROLE_LABELS[m.profiles.role] : "—"}
                        </div>
                      </div>
                      {!isLeader && (
                        <form action={setTeamLeader}>
                          <input type="hidden" name="teamId" value={team.id} />
                          <input type="hidden" name="profileId" value={m.profile_id} />
                          <button
                            type="submit"
                            className="shrink-0 rounded-[8px] px-2.5 py-1.5 text-[11.5px] font-bold text-muted hover:bg-neutral-bg hover:text-foreground"
                          >
                            Fă lider
                          </button>
                        </form>
                      )}
                      <form action={removeMember}>
                        <input type="hidden" name="teamId" value={team.id} />
                        <input type="hidden" name="profileId" value={m.profile_id} />
                        <button
                          type="submit"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-muted-2 hover:bg-danger-bg hover:text-danger"
                          aria-label="Elimină din echipă"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[13px] text-muted">Niciun membru adăugat încă.</p>
            )}

            {assignableProfiles.length > 0 && (
              <form
                action={addMember}
                className="mt-2 flex items-center gap-2 border-t border-[#f2f4f7] pt-4"
              >
                <input type="hidden" name="teamId" value={team.id} />
                <select
                  name="profileId"
                  required
                  defaultValue=""
                  className="w-full rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
                >
                  <option value="" disabled>
                    Alege un coleg…
                  </option>
                  {assignableProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} — {ROLE_LABELS[p.role]}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="flex shrink-0 items-center justify-center gap-1.5 rounded-[9px] bg-neutral-bg px-3.5 py-2 text-[12.5px] font-bold text-[#344054]"
                >
                  <Plus className="h-3.5 w-3.5" /> Adaugă
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="rounded-[13px] border border-border bg-white">
          <div className="border-b border-[#f2f4f7] px-5 py-3.5 text-[14.5px] font-bold text-foreground">
            Vehicule
          </div>
          <div className="flex flex-col gap-2 p-5">
            {team.vehicles.length > 0 ? (
              <div className="flex flex-col divide-y divide-[#f2f4f7]">
                {team.vehicles.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 py-2.5">
                    <Truck className="h-4 w-4 shrink-0 text-muted" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-foreground">
                        {v.name}
                      </div>
                      {v.plate_number && (
                        <div className="truncate text-[12px] text-muted-2">
                          {v.plate_number}
                        </div>
                      )}
                    </div>
                    <form action={removeVehicle}>
                      <input type="hidden" name="vehicleId" value={v.id} />
                      <input type="hidden" name="teamId" value={team.id} />
                      <button
                        type="submit"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-muted-2 hover:bg-danger-bg hover:text-danger"
                        aria-label="Elimină vehiculul"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted">Niciun vehicul asociat încă.</p>
            )}

            <form
              action={addVehicle}
              className="mt-2 flex flex-col gap-2 border-t border-[#f2f4f7] pt-4"
            >
              <input type="hidden" name="teamId" value={team.id} />
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="name"
                  required
                  placeholder="Ex: Dacia Dokker 1"
                  className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
                />
                <input
                  name="plateNumber"
                  placeholder="Nr. înmatriculare"
                  className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 self-start rounded-[9px] bg-neutral-bg px-3.5 py-2 text-[12.5px] font-bold text-[#344054]"
              >
                <Plus className="h-3.5 w-3.5" /> Adaugă vehicul
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="rounded-[13px] border border-border bg-white">
        <div className="border-b border-[#f2f4f7] px-5 py-3.5 text-[14.5px] font-bold text-foreground">
          Lucrări echipă
        </div>
        {jobs && jobs.length > 0 ? (
          <div className="flex flex-col divide-y divide-[#f2f4f7]">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/lucrari/${job.id}`}
                prefetch={false}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#f9fafb]"
              >
                <div className="w-16 shrink-0 text-[13px] font-bold text-electric">
                  #{job.display_number}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-bold text-foreground">
                    {job.title}
                  </div>
                  <div className="text-[12px] text-muted-2">
                    {job.clients?.name} · {job.scheduled_date}
                  </div>
                </div>
                <StatusBadge
                  label={JOB_STATUS_LABELS[job.status]}
                  className={JOB_STATUS_STYLES[job.status]}
                />
              </Link>
            ))}
          </div>
        ) : (
          <p className="flex items-center gap-2 p-5 text-[13.5px] text-muted">
            <UserRound className="h-4 w-4" /> Nicio lucrare asignată acestei echipe încă.
          </p>
        )}
      </div>
    </div>
  );
}
