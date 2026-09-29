// Resolves a free-text address to coordinates via OpenStreetMap's Nominatim,
// the same free service this app already relies on for map tiles — no API
// key needed, but usage policy requires a real User-Agent and caps at ~1
// request/second, which is fine for our one-geocode-per-new-address volume.
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ro&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ElectroField/1.0 (support@electrofield.ro)" },
    });
    if (!res.ok) return null;

    const results = (await res.json()) as { lat: string; lon: string }[];
    const first = results[0];
    if (!first) return null;

    const lat = parseFloat(first.lat);
    const lng = parseFloat(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return { lat, lng };
  } catch {
    return null;
  }
}
