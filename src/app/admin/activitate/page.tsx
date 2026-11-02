import Link from "next/link";
import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { startOfOrgDay, todayInOrgTimeZone } from "@/lib/date";
import { UUID } from "@/lib/preview";

function duration(seconds: number) { return `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m`; }
function date(iso: string) { return new Date(iso).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", dateStyle: "short", timeStyle: "short" }); }

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ company?: string; range?: string }> }) {
  await requireAdminContext();
  const params = await searchParams;
  const company = UUID.test(params.company ?? "") ? params.company! : "";
  const range = params.range === "day" ? 1 : params.range === "month" ? 30 : 7;
  const today = todayInOrgTimeZone();
  const start = new Date(`${today}T12:00:00Z`); start.setUTCDate(start.getUTCDate() - range + 1);
  const since = start.toISOString().slice(0, 10);
  const db = await createClient({ ignorePreview: true });
  let dailyQuery = db.from("platform_usage_daily").select("*").gte("day", since).order("day", { ascending: false });
  let sessionsQuery = db.from("platform_usage_sessions").select("*").gte("last_seen_at", startOfOrgDay(since)).order("last_seen_at", { ascending: false }).limit(200);
  if (company) { dailyQuery = dailyQuery.eq("organization_id", company); sessionsQuery = sessionsQuery.eq("organization_id", company); }
  const [{ data: companies }, { data: daily, error }, { data: sessions, error: sessionError }] = await Promise.all([
    db.rpc("platform_admin_list_companies_v2"), dailyQuery, sessionsQuery,
  ]);
  const names = new Map((companies ?? []).map((c) => [c.id, c.name]));
  const totals = new Map<string, { web: number; mobile: number; sessions: number; users: Set<string> }>();
  const summaries = new Map<string, { organizationId: string; day: string; channel: string; seconds: number; visits: number; users: Set<string> }>();
  for (const row of daily ?? []) {
    const value = totals.get(row.organization_id) ?? { web: 0, mobile: 0, sessions: 0, users: new Set<string>() };
    value[row.channel as "web" | "mobile"] += row.active_seconds;
    value.sessions += row.sessions; value.users.add(row.profile_id); totals.set(row.organization_id, value);
    const key = `${row.organization_id}-${row.day}-${row.channel}`;
    const summary = summaries.get(key) ?? { organizationId: row.organization_id, day: row.day, channel: row.channel, seconds: 0, visits: 0, users: new Set<string>() };
    summary.seconds += row.active_seconds; summary.visits += row.sessions; summary.users.add(row.profile_id); summaries.set(key, summary);
  }
  return <div className="mx-auto max-w-6xl space-y-5 p-6">
    <h1 className="text-2xl font-extrabold">Activitatea companiilor</h1>
    <p className="text-sm text-muted">Timp activ estimat, cu pagina vizibilă și interacțiune în ultimul minut. Separat pentru interfața web și cea mobilă. Datele se colectează de la activarea funcției.</p>
    <form className="flex flex-wrap gap-3">
      <select aria-label="Companie" name="company" defaultValue={company} className="rounded-lg border border-border bg-white p-2"><option value="">Toate companiile</option>{(companies ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <select aria-label="Perioadă" name="range" defaultValue={range === 1 ? "day" : range === 30 ? "month" : "week"} className="rounded-lg border border-border bg-white p-2"><option value="day">Astăzi</option><option value="week">Ultimele 7 zile</option><option value="month">Ultimele 30 de zile</option></select>
      <button className="rounded-lg bg-purple px-4 py-2 font-semibold text-white">Afișează</button>
    </form>
    {(error || sessionError) && <p className="rounded-lg bg-danger-bg p-3 text-danger">Nu am putut încărca activitatea. Verifică instalarea actualizării bazei de date.</p>}
    <div className="overflow-auto rounded-xl border border-border bg-white"><table className="w-full text-left text-sm"><thead className="bg-neutral-bg"><tr>{["Companie", "Utilizatori activi", "Web", "Mobil", "Vizite"].map((s) => <th key={s} className="p-3">{s}</th>)}</tr></thead><tbody>
      {(companies ?? []).filter((c) => !company || c.id === company).map((c) => { const t = totals.get(c.id); return <tr key={c.id} className="border-t border-border"><td className="p-3"><Link className="text-purple" href={`/admin/companii/${c.id}`}>{c.name}</Link></td><td className="p-3">{t?.users.size ?? 0}</td><td className="p-3">{duration(t?.web ?? 0)}</td><td className="p-3">{duration(t?.mobile ?? 0)}</td><td className="p-3">{t?.sessions ?? 0}</td></tr>; })}
    </tbody></table></div>
    <details className="rounded-xl border border-border bg-white p-4"><summary className="cursor-pointer font-bold">Rezumat zilnic · {since} – {today}</summary><div className="mt-3 space-y-2 text-sm">
      {[...summaries].map(([key, r]) => <div key={key} className="flex flex-wrap justify-between gap-2 border-b border-border py-2"><span>{r.day} · {names.get(r.organizationId)} · {r.channel === "web" ? "Web" : "Mobil"}</span><span>{duration(r.seconds)} · {r.visits} vizite · {r.users.size} utilizatori</span></div>)}
      {!daily?.length && <p className="text-muted">Nu există activitate înregistrată în această perioadă.</p>}
    </div></details>
    <h2 className="text-lg font-bold">Ultimele 200 de vizite</h2>
    <p className="text-xs text-muted">O vizită începe la deschiderea unei pagini. Ieșirea este confirmată când dispozitivul transmite închiderea; altfel afișăm ultima activitate, fără să inventăm ora deconectării.</p>
    <div className="overflow-auto rounded-xl border border-border bg-white"><table className="w-full text-left text-xs"><thead className="bg-neutral-bg"><tr>{["Companie", "Interfață", "Intrare", "Ultima activitate / ieșire", "Timp activ", "Stare"].map((s) => <th key={s} className="p-3">{s}</th>)}</tr></thead><tbody>{(sessions ?? []).map((s) => <tr key={s.id} className="border-t border-border"><td className="p-3">{names.get(s.organization_id)}</td><td className="p-3">{s.channel === "web" ? "Web" : "Mobil"}</td><td className="p-3">{date(s.started_at)}</td><td className="p-3">{date(s.ended_at ?? s.last_active_at ?? s.started_at)}</td><td className="p-3">{duration(s.active_seconds)}</td><td className="p-3">{s.end_reason === "logout" ? "Deconectare" : s.ended_at ? "Închisă" : Date.now() - new Date(s.last_active_at ?? s.started_at).getTime() < 90_000 ? "Recent activă" : "Fără semnal recent"}</td></tr>)}</tbody></table></div>
  </div>;
}
