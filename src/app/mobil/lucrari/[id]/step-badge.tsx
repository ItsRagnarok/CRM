// A fixed, canonical numbering for every screen in the technician's job
// flow — including the depot detour, which is conditional (only shown when
// materials/tools are missing) but still gets its own permanent numbers so
// the technician always knows where he stands, even mid-detour.
export const JOB_STEPS = {
  checklist: { n: "1", label: "Materiale și scule" },
  depozit: { n: "2", label: "Deplasare la depozit" },
  ridicare: { n: "3", label: "Ridicare de la depozit" },
  cheltuiala: { n: "4", label: "Verificare materiale lipsă" },
  // Sub-step of 5 (deplasare spre lucrare) — only reached if step 4's
  // answer is "da, îmi lipsește ceva". Rejoins the main numbering at 5.
  achizitie: { n: "5.1", label: "Achiziție materiale lipsă" },
  pornire: { n: "5", label: "Deplasare spre lucrare" },
  sosire: { n: "6", label: "Sosire la lucrare" },
  executie: { n: "7", label: "Execuție lucrare" },
  finalizare: { n: "8", label: "Finalizare" },
  semnatura: { n: "9", label: "Semnătură client" },
} as const;

export type JobStepKey = keyof typeof JOB_STEPS;

export function StepBadge({ step }: { step: JobStepKey }) {
  const info = JOB_STEPS[step];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-electric-soft px-2.5 py-1 text-[10.5px] font-bold text-electric">
      PASUL {info.n} · {info.label}
    </span>
  );
}
