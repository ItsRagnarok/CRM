"use client";

import { useActionState } from "react";
import { manageTeam } from "../actions";

export function ManageTeam({ teamId, name }: { teamId: string; name: string }) {
  const [state, action, pending] = useActionState(manageTeam, {});

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-[13px] border border-border bg-white p-5"
      onSubmit={(event) => {
        const submitter = (event.nativeEvent as SubmitEvent).submitter;
        if (submitter instanceof HTMLButtonElement && submitter.value === "delete") {
          if (!window.confirm(`Ștergi definitiv echipa „${name}”? Membrii, lucrările și vehiculele vor fi dezasociate de echipă.`)) {
            event.preventDefault();
          }
        }
      }}
    >
      <input type="hidden" name="teamId" value={teamId} />
      <label className="flex flex-col gap-2 text-sm font-bold">
        Numele echipei
        <input name="name" defaultValue={name} required className="rounded-lg border border-border px-3 py-2 font-normal" />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="rounded-lg bg-electric px-3 py-2 text-sm font-bold text-white">
          Salvează numele
        </button>
        <button type="submit" name="intent" value="delete" formNoValidate disabled={pending} className="rounded-lg bg-danger-bg px-3 py-2 text-sm font-bold text-danger">
          Șterge echipa
        </button>
      </div>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {state.saved && <p role="status" className="text-sm text-success">Numele echipei a fost salvat.</p>}
    </form>
  );
}
