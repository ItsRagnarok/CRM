"use client";

import { useActionState, useState } from "react";
import { CORRECTION_REASONS } from "@/lib/time-corrections";
import { requestTimeCorrection } from "../actions";

export function CorrectionForm({ jobId, event, entryId, day, defaultTime }: { jobId: string; event: string; entryId: string; day: string; defaultTime: string }) {
  const [state, action, pending] = useActionState(requestTimeCorrection, undefined);
  const [reason, setReason] = useState("");
  return (
    <form action={action} className="m-col" style={{ gap: 14 }}>
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="event" value={event} />
      <input type="hidden" name="entryId" value={entryId} />
      <input type="hidden" name="day" value={day} />
      <div className="m-cd m-col" style={{ gap: 14 }}>
        <div className="m-fld">
          <label htmlFor="time">Ora corectă</label>
          <input id="time" name="time" type="time" required defaultValue={defaultTime} className="m-in" />
        </div>
        <div className="m-fld">
          <span>De ce?</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CORRECTION_REASONS.map((r) => (
              <button key={r} type="button" className="m-chip" onClick={() => setReason(r)} style={reason === r ? { background: "var(--m-acs)", borderColor: "var(--m-ac)", color: "var(--m-aci)" } : undefined}>{r}</button>
            ))}
          </div>
          <textarea name="reason" required minLength={5} maxLength={500} className="m-in" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Scrie pe scurt ce s-a întâmplat" />
        </div>
      </div>
      {state?.error && <div className="m-note bad" role="alert"><div className="m-fl" style={{ fontWeight: 700, color: "var(--m-bad)" }}>{state.error}</div></div>}
      <button className="m-btn" disabled={pending}>{pending ? "Se trimite…" : "Trimite la birou"}</button>
      <div className="m-mu m-sm" style={{ textAlign: "center" }}>Pontajul se schimbă doar după ce biroul aprobă. Vezi starea în pagina Pontaj.</div>
    </form>
  );
}
