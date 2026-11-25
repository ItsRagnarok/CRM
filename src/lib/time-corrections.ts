// Fără importuri: fișierul e testat direct cu node (scripts/time-corrections.test.mjs).
const ORG_TIME_ZONE = "Europe/Bucharest";

export const CORRECTION_REASONS = [
  "Am uitat să apăs butonul",
  "Fără semnal sau telefon descărcat",
  "Am apăsat din greșeală",
  "Am lucrat și după ce am închis",
] as const;

export const EVENT_LABEL: Record<string, string> = { work_start: "Început lucru", work_end: "Sfârșit lucru" };

export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * GPS-ul e doar dovadă: arătăm cât de departe de lucrare a fost telefonul când s-a apăsat butonul.
 * Nu blochează nimic și nu decide singur dacă ora e corectă.
 */
export function gpsProof(
  entry: { lat: number | null; lng: number | null } | null | undefined,
  job: { lat: number | null; lng: number | null } | null | undefined,
): { label: string; tone: "ok" | "warn" | "none" } {
  if (!entry || entry.lat == null || entry.lng == null) return { label: "fără GPS", tone: "none" };
  if (!job || job.lat == null || job.lng == null) return { label: "GPS (lucrarea nu are coordonate)", tone: "none" };
  const m = distanceMeters({ lat: entry.lat, lng: entry.lng }, { lat: job.lat, lng: job.lng });
  const label = m < 1000 ? `GPS la ${Math.round(m / 10) * 10} m de lucrare` : `GPS la ${(m / 1000).toFixed(1).replace(".", ",")} km de lucrare`;
  return { label, tone: m <= 300 ? "ok" : "warn" };
}

/** „2026-11-25” + „08:30” (ora României) → ISO UTC. Ține cont de ora de vară. */
export function orgLocalToIso(day: string, hhmm: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (h > 23 || m > 59) return null;
  const guess = new Date(`${day}T${hhmm}:00Z`);
  if (Number.isNaN(guess.getTime())) return null;
  // Diferența dintre ora afișată în România și UTC, la momentul respectiv (2 sau 3 ore).
  const local = new Intl.DateTimeFormat("en-GB", { timeZone: ORG_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(guess);
  const [lh, lm] = local.split(":").map(Number);
  let offsetMin = lh * 60 + lm - (h * 60 + m);
  if (offsetMin < -720) offsetMin += 1440;
  if (offsetMin > 720) offsetMin -= 1440;
  return new Date(guess.getTime() - offsetMin * 60_000).toISOString();
}

export function orgTime(iso: string) {
  return new Intl.DateTimeFormat("ro-RO", { timeZone: ORG_TIME_ZONE, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
