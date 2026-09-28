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

// Hex fills for map markers — JOB_STATUS_STYLES above is Tailwind classes,
// which Leaflet's divIcon can't resolve (it renders outside the app's CSS
// build via innerHTML), so marker colors are kept as plain hex here.
export const JOB_STATUS_MARKER_COLOR: Record<JobStatus, string> = {
  programata: "#475467",
  in_drum: "#b45309",
  ajunsa: "#1d4ed8",
  in_lucru: "#1d4ed8",
  pauza: "#6d28d9",
  finalizata: "#15803d",
  necesita_atentie: "#b91c1c",
  anulata: "#6b7280",
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
