import Link from "next/link";
import { ArrowLeft, CalendarOff, Plus } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { addTimeOff, decideTimeOff, deleteTimeOff } from "./actions";

const TYPE_LABEL: Record<string, string> = {
  concediu_odihna: "Concediu de odihnă",
  concediu_medical: "Concediu medical",
  invoire: "Învoire",
  absenta_nemotivata: "Absență nemotivată",
};

const STATUS_LABEL: Record<string, string> = { pending: "În așteptare", approved: "Aprobat", rejected: "Respins" };
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-warning-bg text-warning",
  approved: "bg-success-bg text-success",
  rejected: "bg-danger-bg text-danger",
};

function workingDaysBetween(startStr: string, endStr: string, workdays: number[]) {
  const start = new Date(`${startStr}T00:00:00Z`);
  const end = new Date(`${endStr}T00:00:00Z`);
  let count = 0;
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const isoDay = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
    if (workdays.includes(isoDay)) count++;
  }
  return count;
}

export default async function ConcediiPage() {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const [{ data: requests }, { data: profiles }] = await Promise.all([
    supabase
      .from("time_off_requests")
      .select("id, type, start_date, end_date, reason, status, created_at, profiles!time_off_requests_profile_id_fkey(full_name)")
      .eq("organization_id", organization.id)
      .order("start_date", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .order("full_name"),
  ]);

  const pending = (requests ?? []).filter((r) => r.status === "pending");
  const decided = (requests ?? []).filter((r) => r.status !== "pending");

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center gap-3">
        <Link href="/pontaj" className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg">
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <h1 className="text-[17px] font-extrabold text-foreground">Concedii & absențe</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0 flex flex-col gap-4">
          {pending.length > 0 && (
            <div className="overflow-hidden rounded-[13px] border border-warning-bg bg-white">
              <div className="border-b border-[#f2f4f7] bg-warning-bg px-5 py-3 text-[13px] font-bold text-[#7a5b0e]">
                {pending.length} {pending.length === 1 ? "cerere în așteptare" : "cereri în așteptare"}
              </div>
              <div className="flex flex-col divide-y divide-[#f2f4f7]">
                {pending.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-bold text-foreground">{r.profiles?.full_name ?? "—"}</div>
                      <div className="text-[12px] text-muted-2">
                        {TYPE_LABEL[r.type] ?? r.type} · {r.start_date} → {r.end_date}
                        {r.reason ? ` · ${r.reason}` : ""}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <form action={decideTimeOff}>
                        <input type="hidden" name="requestId" value={r.id} />
                        <input type="hidden" name="decision" value="approved" />
                        <button type="submit" className="rounded-[8px] bg-success px-3 py-1.5 text-[12px] font-bold text-white">
                          Aprobă
                        </button>
                      </form>
                      <form action={decideTimeOff}>
                        <input type="hidden" name="requestId" value={r.id} />
                        <input type="hidden" name="decision" value="rejected" />
                        <button type="submit" className="rounded-[8px] bg-neutral-bg px-3 py-1.5 text-[12px] font-bold text-[#344054]">
                          Respinge
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="min-w-0 overflow-hidden rounded-[13px] border border-border bg-white">
            <div className="border-b border-[#f2f4f7] px-5 py-3.5 text-[14.5px] font-bold">Istoric</div>
            {decided.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#f9fafb] text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                      <th className="px-5 py-3">Angajat</th>
                      <th className="px-5 py-3">Tip</th>
                      <th className="px-5 py-3">Perioadă</th>
                      <th className="px-5 py-3">Zile lucrătoare</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {decided.map((r) => (
                      <tr key={r.id} className="border-t border-[#f2f4f7]">
                        <td className="px-5 py-3 text-[13px] font-bold text-foreground">{r.profiles?.full_name ?? "—"}</td>
                        <td className="px-5 py-3 text-[13px] text-[#344054]">{TYPE_LABEL[r.type] ?? r.type}</td>
                        <td className="px-5 py-3 text-[13px] text-muted">{r.start_date} → {r.end_date}</td>
                        <td className="px-5 py-3 text-[13px] text-[#344054]">
                          {workingDaysBetween(r.start_date, r.end_date, organization.standard_workdays)}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[r.status]}`}>
                            {STATUS_LABEL[r.status] ?? r.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <form action={deleteTimeOff}>
                            <input type="hidden" name="requestId" value={r.id} />
                            <button type="submit" className="text-[12px] font-bold text-muted-2 hover:text-danger">
                              Șterge
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5">
                <EmptyState icon={CalendarOff} title="Niciun concediu înregistrat" description="Cererile aprobate/respinse și cele adăugate manual apar aici." />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[13px] border border-border bg-white p-5">
          <div className="mb-3.5 text-[14.5px] font-bold text-foreground">Adaugă concediu/absență</div>
          {profiles && profiles.length > 0 ? (
            <form action={addTimeOff} className="flex flex-col gap-2.5">
              <select
                name="profileId"
                required
                defaultValue=""
                className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
              >
                <option value="" disabled>Alege un angajat…</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
              <select
                name="type"
                required
                defaultValue=""
                className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
              >
                <option value="" disabled>Tip…</option>
                {Object.entries(TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input name="startDate" type="date" required className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric" />
                <input name="endDate" type="date" required className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric" />
              </div>
              <input
                name="reason"
                placeholder="Motiv (opțional)"
                className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
              />
              <button
                type="submit"
                className="mt-1 flex items-center justify-center gap-1.5 rounded-[10px] bg-electric px-4 py-2.5 text-[13.5px] font-bold text-white"
              >
                <Plus className="h-4 w-4" /> Adaugă (aprobat automat)
              </button>
            </form>
          ) : (
            <p className="text-[13px] text-muted">Niciun angajat activ.</p>
          )}
        </div>
      </div>
    </div>
  );
}
