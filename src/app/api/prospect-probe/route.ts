// Test temporar: ce fișiere publică data.gov.ro cu situațiile financiare și registrul firmelor.
// Întoarce doar lista fișierelor și primele rânduri din cel mai nou. Se șterge după test.
export const dynamic = "force-dynamic";

type Res = { name?: string; url?: string; datagovro_download_url?: string; size?: number | null; format?: string; last_modified?: string };
type Pkg = { title: string; name: string; metadata_modified: string; organization?: { name?: string }; resources: Res[] };

async function search(q: string) {
  const r = await fetch(`https://data.gov.ro/api/3/action/package_search?q=${encodeURIComponent(q)}&rows=40&sort=metadata_modified%20desc`, { signal: AbortSignal.timeout(20000), cache: "no-store" });
  const j = (await r.json()) as { result: { results: Pkg[] } };
  return j.result.results.map((p) => ({ title: p.title, name: p.name, org: p.organization?.name, modified: p.metadata_modified,
    files: p.resources.map((x) => ({ name: x.name, url: x.datagovro_download_url ?? x.url, size: x.size, format: x.format })) }));
}

async function head(url: string) {
  try {
    const r = await fetch(url, { headers: { Range: "bytes=0-1500" }, signal: AbortSignal.timeout(20000), cache: "no-store" });
    const buf = new Uint8Array(await r.arrayBuffer());
    return { status: r.status, length: r.headers.get("content-range") ?? r.headers.get("content-length"), sample: new TextDecoder("latin1").decode(buf.slice(0, 1500)) };
  } catch (e) { return { error: String(e).slice(0, 200) }; }
}

export async function GET(req: Request) {
  const u = new URL(req.url).searchParams.get("u");
  if (u) {
    if (!/^https?:\/\/data\.gov\.ro\//.test(u)) return Response.json({ error: "doar data.gov.ro" }, { status: 400 });
    return Response.json(await head(u));
  }
  const [mf, onrc] = await Promise.all([search("situatii financiare"), search("firme inregistrate onrc")]);
  return Response.json({ mf: mf.slice(0, 25), onrc: onrc.slice(0, 4) });
}
