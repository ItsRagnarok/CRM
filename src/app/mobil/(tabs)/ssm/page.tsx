import Link from "next/link";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ScreenHeader } from "@/components/mobile/ui";
import { todayInOrgTimeZone } from "@/lib/date";
import { INCIDENT_LABEL, PHASE_LABEL, STATE_LABEL, trainingState, type IncidentKind, type Phase } from "@/lib/ssm";
import { ConfirmTraining } from "./confirm-training";

const day = (d: string) => new Date(`${d.slice(0, 10)}T12:00:00Z`).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const STATUS: Record<string, string> = { nou: "Trimis", cercetat: "În analiză la birou", inchis: "Închis" };

/** SSM pe telefon: instruirea mea (și confirmarea ei) și rapoartele mele de incident. */
export default async function MobileSsmPage() {
  const { profile } = await requireSessionContext();
  const supabase = await createClient();
  const today = todayInOrgTimeZone();
  const [{ data: trainings }, { data: incidents }] = await Promise.all([
    supabase.from("ssm_trainings").select("id, phase, done_on, next_due, instructor, topic, confirmed_at").eq("profile_id", profile.id).order("done_on", { ascending: false }).limit(20),
    supabase.from("ssm_incidents").select("id, kind, injured, occurred_at, status, measures").eq("reported_by", profile.id).order("occurred_at", { ascending: false }).limit(10),
  ]);
  const st = trainingState(trainings ?? [], today);
  const tone = st.state === "la_zi" ? "ac" : "warn";

  return (
    <div className="flex flex-col">
      <ScreenHeader title="Siguranță (SSM)" back="/mobil/meniu" />
      <div className="m-bd">
        <div className={`m-note ${tone}`}>
          <ShieldCheck className="m-i" />
          <div className="m-fl">
            <b>Instruirea SSM: {STATE_LABEL[st.state]}.</b>{" "}
            {st.due ? (st.days !== null && st.days < 0 ? `A expirat pe ${day(st.due)}. Spune-i biroului.` : `Următoarea până pe ${day(st.due)}.`) : st.state === "lipsa" ? "Biroul nu a trecut încă nicio instruire pe numele tău." : ""}
          </div>
        </div>

        <Link href="/mobil/ssm/incident" className="m-btn"><ShieldAlert className="m-i" /> Raportează un incident</Link>
        <div className="m-mu m-sm" style={{ textAlign: "center" }}>Accident, aproape-accident, scurgere, scurtcircuit, echipament nesigur. Merge și fără semnal.</div>

        {(trainings ?? []).length > 0 && (
          <>
            <div className="m-lb">Instruirile mele</div>
            <div style={{ display: "grid", gap: 10 }}>
              {(trainings ?? []).map((t) => (
                <div key={t.id} className="m-cd" style={{ display: "grid", gap: 6, borderColor: t.confirmed_at ? undefined : "var(--m-ink)" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{PHASE_LABEL[t.phase as Phase] ?? t.phase} · {day(t.done_on)}</div>
                    <div className="m-mu m-sm">{[t.topic, t.instructor && `instructor: ${t.instructor}`].filter(Boolean).join(" · ")}</div>
                  </div>
                  {t.confirmed_at ? <div className="m-mu m-sm">Confirmată pe {day(t.confirmed_at)}.</div> : <ConfirmTraining id={t.id} />}
                </div>
              ))}
            </div>
            <div className="m-mu m-sm">Confirmarea din aplicație ține evidența; fișa individuală de instruire o semnezi și la birou, cât timp firma o cere pe hârtie.</div>
          </>
        )}

        {(incidents ?? []).length > 0 && (
          <>
            <div className="m-lb">Rapoartele mele</div>
            <div className="m-list">
              {(incidents ?? []).map((i) => (
                <div key={i.id} className="m-row" style={{ display: "grid", gap: 2 }}>
                  <b>{i.kind === "accident" && i.injured ? "Accident cu rănit" : INCIDENT_LABEL[i.kind as IncidentKind]} · {day(i.occurred_at)}</b>
                  <span className="m-mu m-sm">{STATUS[i.status] ?? i.status}{i.measures ? ` · Măsură: ${i.measures}` : ""}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
