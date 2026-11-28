// Test temporar: ajunge serverul aplicației la sursele publice de firme (data.gov.ro, ANRE)?
// Nu citește și nu întoarce date, doar codul de răspuns. Se șterge după test.
export const dynamic = "force-dynamic";

const TARGETS = [
  "https://data.gov.ro/api/3/action/package_search?q=situatii%20financiare&rows=3",
  "https://www.anre.ro/",
  "https://webservicesp.anaf.ro/bilant?an=2024&cui=14399840",
];

export async function GET() {
  const results = await Promise.all(TARGETS.map(async (url) => {
    const t = Date.now();
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(15000), cache: "no-store" });
      const body = await r.text();
      return { url, status: r.status, ms: Date.now() - t, bytes: body.length, sample: url.includes("data.gov.ro") ? body.slice(0, 1500) : undefined };
    } catch (e) {
      return { url, error: String(e).slice(0, 200), ms: Date.now() - t };
    }
  }));
  return Response.json({ region: process.env.VERCEL_REGION ?? null, results });
}
