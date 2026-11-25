"use client";

import { FormRunner } from "../../formular/[template]/form-runner";
import { GAS_TEMPLATES } from "@/lib/forms/gas-record";

export function GasForm(p: {
  jobId: string;
  unitId: string | null;
  unitLabel: string;
  jobLabel: string;
  kind: "verificare" | "revizie";
  initialData: Record<string, unknown>;
  completed: boolean;
  doneHref: string;
}) {
  return (
    <FormRunner
      jobId={p.jobId}
      jobLabel={p.jobLabel}
      template={GAS_TEMPLATES[p.kind]}
      initialData={p.initialData}
      alreadyCompleted={p.completed}
      lockedNotice={p.completed ? "Fișa e încheiată și trimisă la birou. Pentru corecturi, cere biroului." : null}
      doneHref={p.doneHref}
      buildOp={(data, complete, at) => ({ kind: "gas", jobId: p.jobId, unitId: p.unitId, unitLabel: p.unitLabel, recordKind: p.kind, data, complete, at })}
    />
  );
}
