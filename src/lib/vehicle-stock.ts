// Stocul de pe mașină: lista „ce trebuie să fie în mașină” (țintă + prag) și ce trebuie încărcat.
// Regula: când cantitatea scade sub prag, mașina se completează până la țintă.
// Fără prag setat, pragul e jumătate din țintă (rotunjit în sus).

export type VehicleStockRow = { quantity: number; target_qty: number | null; min_qty: number | null };
export type VehicleStockStatus = "lipsa" | "sub_prag" | "ok" | "fara_tinta";

export function effectiveMin(target: number | null, min: number | null): number | null {
  if (target == null) return null;
  return min ?? Math.ceil(target / 2);
}

export function vehicleStockStatus(r: VehicleStockRow): VehicleStockStatus {
  const min = effectiveMin(r.target_qty, r.min_qty);
  if (r.target_qty == null || min == null) return "fara_tinta";
  if (Number(r.quantity) <= 0 && r.target_qty > 0) return "lipsa";
  return Number(r.quantity) < min ? "sub_prag" : "ok";
}

/** Cât trebuie încărcat ca să revină la țintă; 0 dacă e peste prag sau nu e în listă. */
export function restockNeed(r: VehicleStockRow): number {
  const st = vehicleStockStatus(r);
  if (st !== "lipsa" && st !== "sub_prag") return 0;
  return Math.max(0, Number(r.target_qty) - Number(r.quantity));
}

export const STATUS_LABEL: Record<VehicleStockStatus, string> = {
  lipsa: "Lipsă",
  sub_prag: "Sub prag",
  ok: "OK",
  fara_tinta: "Fără țintă",
};

export const qty = (n: number) => Number(n).toLocaleString("ro-RO", { maximumFractionDigits: 2 });
