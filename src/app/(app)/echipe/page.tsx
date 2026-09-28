import Link from "next/link";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { ROLE_LABELS } from "@/lib/auth";
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES } from "@/lib/status";
import { UsersRound, Plus } from "lucide-react";

const AVATAR_PALETTE = [
  { bg: "#EFF4FF", text: "#2F6FED" },
  { bg: "#F5F3FF", text: "#6D28D9" },
  { bg: "#FEF9EC", text: "#B45309" },
  { bg: "#F0FDF4", text: "#15803D" },
  { bg: "#F2F4F7", text: "#475467" },
];

export default async function EchipePage() {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: teams } = await supabase
    .from("teams")
    .select(
      "id, name, is_active, leader:profiles!teams_team_leader_id_fkey(id, full_name), team_members(profile_id, profiles(id, full_name, role))"
    )
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: true });

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
      <div className="flex items-center justify-between">
        <h1 className="text-[17px] font-extrabold text-foreground">Echipe</h1>
        <Link
          href="/echipe/noua"
          className="flex items-center gap-1.5 rounded-[10px] bg-electric px-4 py-2.5 text-[13.5px] font-bold text-white"
        >
          <Plus className="h-4 w-4" /> Echipă nouă
        </Link>
      </div>

      {teams && teams.length > 0 ? (
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
