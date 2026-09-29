export type MobileStage = "checklist" | "depozit" | "ridicare" | "cheltuiala" | "ready";

export function mobileStagePath(jobId: string, stage: MobileStage | null | undefined) {
  switch (stage) {
    case "checklist":
      return `/mobil/lucrari/${jobId}/checklist`;
    case "depozit":
      return `/mobil/lucrari/${jobId}/depozit`;
    case "ridicare":
      return `/mobil/lucrari/${jobId}/ridicare`;
    case "cheltuiala":
      return `/mobil/lucrari/${jobId}/cheltuiala`;
    case "ready":
      return `/mobil/lucrari/${jobId}`;
    default:
      return `/mobil/lucrari/${jobId}/checklist`;
  }
}
