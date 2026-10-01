import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdminContext, ROLE_LABELS } from "@/lib/auth";
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES } from "@/lib/status";

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ro-RO", { dateStyle: "medium", timeStyle: "short" });
}

function sessionDurationLabel(createdAt: string, refreshedAt: string | null) {
  const start = new Date(createdAt).getTime();
  const end = refreshedAt ? new Date(refreshedAt).getTime() : Date.now();
  const minutes = Math.max(0, Math.round((end - start) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return `${hours} h ${rem} min`;
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string; userId: string }>;
}) {
  await requireAdminContext();
  const { id, userId } = await params;
  const supabase = await createClient();

  const [{ data: userRows }, { data: jobs }, { data: sessions }, { data: positionRows }] = await Promise.all([
    supabase.rpc("platform_admin_get_user_detail", { target_profile_id: userId }),
    supabase.rpc("platform_admin_list_user_jobs", { target_profile_id: userId }),
    supabase.rpc("platform_admin_list_user_sessions", { target_profile_id: userId }),
    supabase.rpc("platform_admin_get_user_last_position", { target_profile_id: userId }),
  ]);

  const user = userRows?.[0];
  if (!user || user.organization_id !== id) notFound();
  const position = positionRows?.[0];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href={`/admin/companii/${id}`}
        className="mb-4 flex w-fit items-center gap-1.5 text-[13px] font-semibold text-[#9b93b5]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Înapoi la {user.organization_name}
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="text-[22px] font-extrabold text-[#17151f]">{user.full_name}</h1>
        <span className="rounded-full bg-[#f2f0f9] px-2.5 py-1 text-[11px] font-bold text-[#5c5670]">
          {ROLE_LABELS[user.role]}
        </span>
        {!user.is_active && (
          <span className="rounded-full bg-danger-bg px-2.5 py-1 text-[11px] font-bold text-danger">Inactiv</span>
        )}
      </div>
      <div className="mt-1 text-[13px] text-[#9b93b5]">
        {user.email} {user.phone ? `· ${user.phone}` : ""}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3.5">
        <div className="rounded-[13px] border border-border bg-white p-4">
          <div className="text-[11.5px] font-semibold text-muted-2">CONT CREAT</div>
          <div className="mt-1 text-[13px] font-bold">{formatDateTime(user.created_at)}</div>
        </div>
        <div className="rounded-[13px] border border-border bg-white p-4">
          <div className="text-[11.5px] font-semibold text-muted-2">ULTIMA AUTENTIFICARE</div>
          <div className="mt-1 text-[13px] font-bold">{formatDateTime(user.last_sign_in_at)}</div>
        </div>
      </div>

      {position && (
        <div className="mt-4 rounded-[13px] border border-border bg-white p-4">
          <div className="text-[11.5px] font-semibold text-muted-2">ULTIMA POZIȚIE CUNOSCUTĂ</div>
          <div className="mt-1 text-[13px] font-bold">
            {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
          </div>
          <div className="mt-0.5 text-[12px] text-[#9b93b5]">
            Înregistrată {formatDateTime(position.recorded_at)}
            {position.accuracy_m ? ` · precizie ±${Math.round(position.accuracy_m)}m` : ""}
          </div>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-[14px] border border-[#e7e3f5] bg-white">
        <div className="border-b border-[#f2f0f9] px-5 py-3.5 text-[14px] font-bold text-[#17151f]">
          Lucrări asignate ({jobs?.length ?? 0})
        </div>
        <div className="flex flex-col divide-y divide-[#f2f0f9]">
          {(jobs ?? []).map((j) => (
            <div key={j.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <div className="text-[13.5px] font-bold text-[#17151f]">{j.title}</div>
                <div className="text-[12px] text-[#9b93b5]">
                  {j.client_name} · {new Date(j.scheduled_date).toLocaleDateString("ro-RO")}
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${JOB_STATUS_STYLES[j.status]}`}>
                {JOB_STATUS_LABELS[j.status]}
              </span>
            </div>
          ))}
          {(jobs ?? []).length === 0 && (
            <div className="px-5 py-6 text-center text-[13px] text-[#9b93b5]">Nicio lucrare asignată.</div>
          )}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[14px] border border-[#e7e3f5] bg-white">
        <div className="border-b border-[#f2f0f9] px-5 py-3.5 text-[14px] font-bold text-[#17151f]">
          Sesiuni de autentificare ({sessions?.length ?? 0})
        </div>
        <div className="flex flex-col divide-y divide-[#f2f0f9]">
          {(sessions ?? []).map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <div className="text-[13.5px] font-bold text-[#17151f]">{formatDateTime(s.created_at)}</div>
                <div className="text-[12px] text-[#9b93b5]">
                  {s.user_agent ? s.user_agent.slice(0, 60) : "Agent necunoscut"} {s.ip ? `· ${s.ip}` : ""}
                </div>
              </div>
              <span className="rounded-full bg-[#f2f0f9] px-2.5 py-1 text-[11px] font-bold text-[#5c5670]">
                {sessionDurationLabel(s.created_at, s.refreshed_at)}
              </span>
            </div>
          ))}
          {(sessions ?? []).length === 0 && (
            <div className="px-5 py-6 text-center text-[13px] text-[#9b93b5]">Nicio sesiune înregistrată.</div>
          )}
        </div>
      </div>
    </div>
  );
}
