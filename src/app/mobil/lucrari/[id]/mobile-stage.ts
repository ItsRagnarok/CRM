export type MobileStage = "checklist" | "depozit" | "cheltuiala" | "ready";

export function mobileStagePath(jobId: string, stage: MobileStage | null | undefined) {
  switch (stage) {
    case "checklist":
      return `/mobil/lucrari/${jobId}/checklist`;
    case "depozit":
      return `/mobil/lucrari/${jobId}/depozit`;
    case "cheltuiala":
      return `/mobil/lucrari/${jobId}/cheltuiala`;
    case "ready":
      return `/mobil/lucrari/${jobId}`;
    default:
      return `/mobil/lucrari/${jobId}/checklist`;
  }
}
