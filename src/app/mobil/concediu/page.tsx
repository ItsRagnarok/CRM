import { CalendarOff } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyScreen, ScreenHeader } from "@/components/mobile/ui";
import { requestTimeOff } from "./actions";

const TYPE_LABEL: Record<string, string> = {
  concediu_odihna: "Concediu de odihnă",
  concediu_medical: "Concediu medical",
  invoire: "Învoire",
  absenta_nemotivata: "Absență nemotivată",
};
const STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "În așteptare", tone: "wr" },
  approved: { label: "Aprobat", tone: "ok" },
  rejected: { label: "Respins", tone: "bad" },
};

const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("ro-RO", { day: "numeric", month: "short", timeZone: "UTC" });

export default async function MobileTimeOffPage() {
  const { profile } = await requireSessionContext();
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("time_off_requests")
    .select("id, type, start_date, end_date, reason, status")
    .eq("profile_id", profile.id)
    .order("start_date", { ascending: false });

  return (
    <div className="flex flex-col">
      <ScreenHeader title="Concediu și absențe" back="/mobil/meniu" />
      <div className="m-bd" style={{ overflow: "visible" }}>
        <form action={requestTimeOff} className="m-cd m-col">
          <div style={{ fontSize: 16, fontWeight: 800 }}>Cerere nouă</div>
          <div className="m-fld">
            <label htmlFor="type">Tip</label>
            <select id="type" name="type" required defaultValue="" className="m-in">
              <option value="" disabled>Alege…</option>
              {Object.entries(TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="m-r" style={{ gap: 10 }}>
            <div className="m-fld m-fl"><label htmlFor="startDate">De la</label><input id="startDate" name="startDate" type="date" required className="m-in" /></div>
            <div className="m-fld m-fl"><label htmlFor="endDate">Până la</label><input id="endDate" name="endDate" type="date" required className="m-in" /></div>
          </div>
          <div className="m-fld"><label htmlFor="reason">Motiv (opțional)</label><input id="reason" name="reason" className="m-in" /></div>
          <button type="submit" className="m-btn">Trimite cererea</button>
        </form>

        <div className="m-lb" style={{ marginTop: 6 }}>Cererile mele</div>
        {requests && requests.length > 0 ? (
          <div className="m-list">
            {requests.map((r) => (
              <div key={r.id}>
                <div className="m-row">
                  <div className="m-fl">
                    <div className="t">{TYPE_LABEL[r.type] ?? r.type}</div>
                    <div className="d">{fmt(r.start_date)} – {fmt(r.end_date)}{r.reason ? ` · ${r.reason}` : ""}</div>
                  </div>
                  <span className={`m-pl ${STATUS[r.status]?.tone ?? ""}`}>{STATUS[r.status]?.label ?? r.status}</span>
                </div>
                <hr className="m-sep" />
              </div>
            ))}
          </div>
        ) : (
          <div className="m-cd" style={{ padding: 0 }}>
            <EmptyScreen icon={CalendarOff} title="Nicio cerere">Cererile tale de concediu sau învoire apar aici.</EmptyScreen>
          </div>
        )}
      </div>
    </div>
  );
}
