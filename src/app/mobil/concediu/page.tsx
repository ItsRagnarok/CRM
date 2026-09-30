import Link from "next/link";
import { ArrowLeft, CalendarOff } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { requestTimeOff } from "./actions";

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

export default async function MobileTimeOffPage() {
  const { profile } = await requireSessionContext();
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("time_off_requests")
    .select("id, type, start_date, end_date, reason, status")
    .eq("profile_id", profile.id)
    .order("start_date", { ascending: false });

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#eaecf0] px-4 py-2.5">
        <Link href="/mobil/profil" className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg">
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <div className="text-[15px] font-extrabold">Concediu & absențe</div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-[13px] border border-[#eaecf0] bg-white p-4">
          <div className="mb-3 text-[13.5px] font-bold text-foreground">Cerere nouă</div>
          <form action={requestTimeOff} className="flex flex-col gap-2.5">
            <select
              name="type"
              required
              defaultValue=""
              className="rounded-[10px] border border-[#d0d5dd] px-3 py-2.5 text-[13.5px] outline-none focus:border-electric"
            >
              <option value="" disabled>Tip…</option>
              {Object.entries(TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input name="startDate" type="date" required className="rounded-[10px] border border-[#d0d5dd] px-3 py-2.5 text-[13.5px] outline-none focus:border-electric" />
              <input name="endDate" type="date" required className="rounded-[10px] border border-[#d0d5dd] px-3 py-2.5 text-[13.5px] outline-none focus:border-electric" />
            </div>
            <input
              name="reason"
              placeholder="Motiv (opțional)"
              className="rounded-[10px] border border-[#d0d5dd] px-3 py-2.5 text-[13.5px] outline-none focus:border-electric"
            />
            <button
              type="submit"
              className="mt-1 rounded-[10px] bg-electric py-3 text-center text-[13.5px] font-bold text-white"
            >
              Trimite cererea
            </button>
          </form>
        </div>

        <div className="mt-4">
          <div className="mb-2 text-[11.5px] font-bold text-muted-2">CERERILE MELE</div>
          {requests && requests.length > 0 ? (
            <div className="flex flex-col gap-2">
              {requests.map((r) => (
                <div key={r.id} className="rounded-[12px] border border-[#eaecf0] bg-white p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-foreground">{TYPE_LABEL[r.type] ?? r.type}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[r.status]}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </div>
                  <div className="mt-1 text-[12px] text-muted-2">{r.start_date} → {r.end_date}</div>
                  {r.reason && <div className="mt-1 text-[12px] text-muted-2">{r.reason}</div>}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={CalendarOff} title="Nicio cerere" description="Cererile tale de concediu/învoire vor apărea aici." />
          )}
        </div>
      </div>
    </div>
  );
}
