"use client";

import { useActionState, useState } from "react";
import { confirmTool, returnTool } from "./actions";

const CONDS = [["buna", "Bună"], ["uzata", "Uzată"], ["defecta", "Defectă"]] as const;

function CondPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {CONDS.map(([id, label]) => (
        <button key={id} type="button" onClick={() => onChange(id)} className={`m-chip ${value === id ? "on" : ""}`} style={{ flex: 1, justifyContent: "center" }}>{label}</button>
      ))}
    </div>
  );
}

/** Confirmarea primirii, cu starea sculei; confirmarea apare pe loc. */
export function ConfirmForm({ handoverId, condition }: { handoverId: string; condition: string }) {
  const [state, action, pending] = useActionState(confirmTool, undefined);
  const [cond, setCond] = useState(condition);
  if (state?.ok) return <div className="m-note ac">Ai confirmat primirea. Biroul vede confirmarea în registru.</div>;
  return (
    <form action={action} style={{ display: "grid", gap: 8 }}>
      <input type="hidden" name="handoverId" value={handoverId} />
      <input type="hidden" name="condition" value={cond} />
      <span className="m-mu m-sm">În ce stare ai primit-o?</span>
      <CondPicker value={cond} onChange={setCond} />
      {cond !== "buna" && <input name="note" className="m-in" maxLength={500} placeholder="Ce are? (ex. cablu de test rupt)" />}
      <button className="m-btn" disabled={pending}>{pending ? "Se trimite…" : "Am primit-o"}</button>
      {state?.error && <div role="alert" className="m-note warn">{state.error}</div>}
    </form>
  );
}

/** Returnarea: biroul confirmă când o primește. */
export function ReturnForm({ toolId, condition }: { toolId: string; condition: string }) {
  const [state, action, pending] = useActionState(returnTool, undefined);
  const [open, setOpen] = useState(false);
  const [cond, setCond] = useState(condition);
  if (state?.ok) return <div className="m-note">Returnare anunțată. Scula rămâne pe numele tău până o primește biroul.</div>;
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="m-chip" style={{ alignSelf: "flex-start" }}>O returnez</button>;
  return (
    <form action={action} style={{ display: "grid", gap: 8 }}>
      <input type="hidden" name="toolId" value={toolId} />
      <input type="hidden" name="condition" value={cond} />
      <span className="m-mu m-sm">În ce stare o predai?</span>
      <CondPicker value={cond} onChange={setCond} />
      <input name="note" className="m-in" maxLength={500} placeholder="Notă (opțional)" />
      <button className="m-btn" disabled={pending}>{pending ? "Se trimite…" : "Anunță biroul"}</button>
      {state?.error && <div role="alert" className="m-note warn">{state.error}</div>}
    </form>
  );
}
