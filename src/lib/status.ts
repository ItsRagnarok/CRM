import type { Database } from "@/lib/supabase/database.types";

type JobStatus = Database["public"]["Enums"]["job_status"];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  programata: "Programată",
  in_drum: "În drum",
  ajunsa: "Ajunsă",
  in_lucru: "În lucru",
  pauza: "Pauză",
  finalizata: "Finalizată",
  necesita_atentie: "Necesită atenție",
  anulata: "Anulată",
};

export const JOB_STATUS_STYLES: Record<JobStatus, string> = {
  programata: "bg-neutral-bg text-neutral",
  in_drum: "bg-warning-bg text-warning",
  ajunsa: "bg-info-bg text-info",
  in_lucru: "bg-info-bg text-info",
  pauza: "bg-[#f5f3ff] text-[#6d28d9]",
  finalizata: "bg-success-bg text-success",
  necesita_atentie: "bg-danger-bg text-danger",
  anulata: "bg-[#f3f4f6] text-[#6b7280]",
};

export const JOB_TYPE_LABELS: Record<
  Database["public"]["Enums"]["job_type"],
  string
> = {
  instalare: "Instalare",
  reparatie: "Reparație",
  mentenanta: "Mentenanță",
  inspectie: "Inspecție",
  interventie: "Intervenție",
  service: "Service",
  demontare: "Demontare",
  urgenta: "Urgență",
};

export const JOB_PRIORITY_LABELS: Record<
  Database["public"]["Enums"]["job_priority"],
  string
> = {
  normala: "Normală",
  ridicata: "Ridicată",
  urgenta: "Urgentă",
};
