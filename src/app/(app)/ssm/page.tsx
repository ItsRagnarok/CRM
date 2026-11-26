import Link from "next/link";
import { redirect } from "next/navigation";
import { HardHat } from "lucide-react";
import { requireSessionContext, isBackOfficeRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signedAttachmentUrls } from "@/lib/storage";
import { todayInOrgTimeZone } from "@/lib/date";
import { ROLE_LABELS } from "@/lib/role-labels";
import { EmptyState } from "@/components/empty-state";
import {
  INCIDENT_LABEL, PHASE_LABEL, STATE_LABEL, TEMPLATES, isHeightFitness, itmHint, trainingState,
  type IncidentKind, type Phase, type SsmState, type Template,
} from "@/lib/ssm";
import { TrainingForm } from "./training-form";
import { deleteTraining, updateIncident } from "./actions";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "instruire", label: "Instruire" },
  { id: "incidente", label: "Incidente" },
  { id: "verificari", label: "Verificări pe lucrări" },
] as const;
const STATE_STYLE: Record<SsmState, string> = {
  lipsa: "bg-neutral-bg text-neutral",
  expirat: "bg-danger-bg text-danger",
  curand: "bg-warning-bg text-warning",
  la_zi: "bg-success-bg text-success",
};
const INC_STATUS: Record<string, string> = { nou: "Nou", cercetat: "Cercetat", inchis: "Închis" };
const day = (d: string) => new Date(`${d.slice(0, 10)}T12:00:00Z`).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const when = (iso: string) => new Date(iso).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function SsmPage({ searchParams }: { searchParams: Promise<{ tab?: string; salvat?: string }> }) {
  const { tab: tabParam, salvat } = await searchParams;
  const requested = TABS.some((t) => t.id === tabParam) ? tabParam! : null;
  const { organization, profile, readOnly } = await requireSessionContext();
  if (!isBackOfficeRole(profile.role)) redirect("/dashboard");
  const supabase = await createClient();
  const today = todayInOrgTimeZone();

  const [{ data: people }, { data: trainings }, { data: fitness }, { data: members }, { data: incidents }, { data: checks }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role").eq("organization_id", organization.id).eq("is_active", true).order("full_name"),
    supabase.from("ssm_trainings").select("id, profile_id, phase, done_on, next_due, instructor, topic, confirmed_at").eq("organization_id", organization.id).order("done_on", { ascending: false }),
    supabase.from("compliance_items").select("profile_id, title, expires_on").eq("organization_id", organization.id).eq("kind", "person"),
    supabase.from("team_members").select("profile_id, teams(name)"),
    supabase.from("ssm_incidents").select("id, kind, injured, description, photo_path, occurred_at, status, measures, job_id, reported_by, profiles!ssm_incidents_reported_by_fkey(full_name), jobs(display_number, title)").eq("organization_id", organization.id).order("occurred_at", { ascending: false }).limit(100),
    requested === "verificari"
      ? supabase.from("ssm_checks").select("id, template, items, all_ok, checked_at, job_id, profiles(full_name), jobs(display_number, title)").eq("organization_id", organization.id).order("checked_at", { ascending: false }).limit(100)
      : Promise.resolve({ data: null }),
  ]);

  // Fără tab ales: dacă există incidente noi (necercetate), pagina se deschide direct pe ele.
  const tab = requested ?? ((incidents ?? []).some((i) => i.status === "nou") ? "incidente" : "instruire");
  const teamOf = new Map((members ?? []).map((m) => [m.profile_id, m.teams?.name ?? null]));
  const byPerson = new Map<string, NonNullable<typeof trainings>>();
  for (const t of trainings ?? []) byPerson.set(t.profile_id, [...(byPerson.get(t.profile_id) ?? []), t]);
  const heightUntil = new Map<string, string>();
  for (const f of fitness ?? []) {
    if (!f.profile_id || !isHeightFitness(f.title)) continue;
    if (!heightUntil.has(f.profile_id) || f.expires_on > heightUntil.get(f.profile_id)!) heightUntil.set(f.profile_id, f.expires_on);
  }
  const rows = (people ?? []).map((p) => ({ ...p, team: teamOf.get(p.id) ?? null, st: trainingState(byPerson.get(p.id) ?? [], today), height: heightUntil.get(p.id) ?? null }));
  const counts = {
    expired: rows.filter((r) => r.st.state === "expirat" || r.st.state === "lipsa").length,
    soon: rows.filter((r) => r.st.state === "curand").length,
    unconfirmed: (trainings ?? []).filter((t) => !t.confirmed_at).length,
    open: (incidents ?? []).filter((i) => i.status !== "inchis").length,
  };
  const teams = [...new Set(rows.map((r) => r.team).filter(Boolean) as string[])].sort();
  const photoUrls = tab === "incidente" ? await signedAttachmentUrls(supabase, (incidents ?? []).map((i) => i.photo_path).filter(Boolean) as string[]) : new Map<string, string>();

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5 p-6">
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground">SSM · siguranța pe teren</h1>
        <p className="mt-1 text-sm text-muted">
          Instruirea fiecărui om, cu data următoarei; aptitudinea pentru lucru la înălțime; verificarea de siguranță de pe telefon, înainte de lucru; incidentele raportate din aplicație.
          Evidența ajută la control, dar nu înlocuiește fișa individuală de instruire semnată, până nu confirmă responsabilul SSM că varianta electronică e acceptată.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Instruire expirată sau lipsă" value={counts.expired} tone={counts.expired ? "bad" : null} />
        <Stat label="Expiră în 30 de zile" value={counts.soon} tone={counts.soon ? "warn" : null} />
        <Stat label="Neconfirmate de oameni" value={counts.unconfirmed} tone={null} />
        <Stat label="Incidente deschise" value={counts.open} tone={counts.open ? "warn" : null} />
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <Link key={t.id} href={`/ssm?tab=${t.id}`} className={`shrink-0 whitespace-nowrap px-4 py-2.5 text-[13.5px] font-semibold ${tab === t.id ? "border-b-2 border-electric text-electric" : "text-muted"}`}>
            {t.label}{t.id === "incidente" && counts.open ? ` · ${counts.open}` : ""}
          </Link>
        ))}
      </div>

      {tab === "instruire" && (
        <>
          {!readOnly && <TrainingForm people={rows.map((r) => ({ id: r.id, name: r.full_name, team: r.team }))} teams={teams} today={today} />}
          <div className="overflow-x-auto rounded-[13px] border border-border bg-white">
            <table className="w-full min-w-[760px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#f9fafb] text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Om</th>
                  <th className="px-4 py-3">Ultima instruire</th>
                  <th className="px-4 py-3">Următoarea</th>
                  <th className="px-4 py-3">Apt la înălțime</th>
                  <th className="px-4 py-3">Istoric</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const list = byPerson.get(r.id) ?? [];
                  const heightOk = r.height && r.height >= today;
                  return (
                    <tr key={r.id} className="border-t border-[#f2f4f7] align-top">
                      <td className="px-4 py-3">
                        <div className="font-bold text-foreground">{r.full_name}</div>
                        <div className="text-[12px] text-muted-2">{ROLE_LABELS[r.role as keyof typeof ROLE_LABELS] ?? r.role}{r.team ? ` · ${r.team}` : ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        {r.st.last ? <>{PHASE_LABEL[r.st.last.phase as Phase] ?? r.st.last.phase}<div className="text-[12px] text-muted-2">{day(r.st.last.done_on)}{r.st.last.confirmed_at ? " · confirmată" : " · neconfirmată"}</div></> : <span className="text-muted">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-bold ${STATE_STYLE[r.st.state]}`}>{STATE_LABEL[r.st.state]}</span>
                        {r.st.due && <div className="mt-1 text-[12px] text-muted-2">{day(r.st.due)}</div>}
                      </td>
                      <td className="px-4 py-3">
                        {r.height ? <span className={heightOk ? "text-success" : "font-semibold text-danger"}>{heightOk ? "până pe " : "expirat pe "}{day(r.height)}</span> : <Link href="/conformitate?tip=person" className="text-muted underline">lipsă</Link>}
                      </td>
                      <td className="px-4 py-3">
                        {list.length === 0 ? <span className="text-muted">—</span> : (
                          <details>
                            <summary className="cursor-pointer text-[12.5px] font-semibold text-[#344054]">{list.length} {list.length === 1 ? "instruire" : "instruiri"}</summary>
                            <ul className="mt-1.5 flex flex-col gap-1.5">
                              {list.map((t) => (
                                <li key={t.id} className="text-[12px] text-[#475467]">
                                  <b>{PHASE_LABEL[t.phase as Phase] ?? t.phase}</b> · {day(t.done_on)}{t.instructor ? ` · ${t.instructor}` : ""}{t.topic ? ` · ${t.topic}` : ""}
                                  {" · "}{t.confirmed_at ? `confirmată ${day(t.confirmed_at)}` : "neconfirmată"}
                                  {!t.confirmed_at && !readOnly && (
                                    <form action={deleteTraining} className="inline">
                                      <input type="hidden" name="id" value={t.id} />
                                      <button className="ml-1.5 text-danger underline">șterge</button>
                                    </form>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[12px] text-muted">„Apt la înălțime” vine din Conformitate → Oameni (documentul „Apt pentru lucru la înălțime (fișa medicală)”, cu data de expirare). Lucrările bifate „la înălțime” nu se pot aloca fără el decât cu confirmare și motiv.</p>
        </>
      )}

      {tab === "incidente" && (
        (incidents ?? []).length === 0 ? (
          <EmptyState icon={HardHat} title="Niciun incident raportat" description="Tehnicienii raportează din aplicație (Meniu → Siguranță, sau din lucrare): accident, aproape-accident, incident periculos, echipament defect." />
        ) : (
          <div className="flex flex-col gap-3">
            {salvat && <p role="status" className="text-[13px] font-semibold text-success">Salvat.</p>}
            {(incidents ?? []).map((i) => (
              <div key={i.id} className={`rounded-[13px] border bg-white p-4 ${i.status !== "inchis" && (i.injured || i.kind === "incident_periculos") ? "border-danger/50" : "border-border"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[15px] font-extrabold text-foreground">{i.kind === "accident" && i.injured ? "Accident cu rănit" : INCIDENT_LABEL[i.kind as IncidentKind]}</div>
                    <div className="text-[12.5px] text-muted">
                      {when(i.occurred_at)} · {i.profiles?.full_name ?? "—"}
                      {i.jobs && <> · <Link href={`/lucrari/${i.job_id}`} className="text-electric">#{i.jobs.display_number} {i.jobs.title}</Link></>}
                    </div>
                    {i.description && <p className="mt-1.5 text-[13.5px] text-[#344054]">„{i.description}”</p>}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${i.status === "inchis" ? "bg-success-bg text-success" : i.status === "cercetat" ? "bg-warning-bg text-warning" : "bg-danger-bg text-danger"}`}>{INC_STATUS[i.status]}</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {i.photo_path && photoUrls.get(i.photo_path) && <a href={photoUrls.get(i.photo_path)} target="_blank" rel="noreferrer"><img src={photoUrls.get(i.photo_path)} alt="Poza incidentului" className="mt-2 h-28 rounded-[10px] object-cover" /></a>}
                <p className="mt-2 rounded-[9px] bg-[#f9fafb] px-3 py-2 text-[12.5px] text-[#475467]">{itmHint(i.kind, i.injured)}</p>
                {!readOnly && (
                  <form action={updateIncident} className="mt-2 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={i.id} />
                    <label className="min-w-[220px] flex-1 text-[12px] font-semibold text-[#344054]">Măsura luată
                      <input name="measures" defaultValue={i.measures ?? ""} maxLength={1000} placeholder="ex. scara înlocuită; instruire suplimentară pentru echipă" className="mt-1 w-full rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px]" />
                    </label>
                    <select name="status" defaultValue={i.status} className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px]">
                      <option value="nou">Nou</option><option value="cercetat">Cercetat</option><option value="inchis">Închis</option>
                    </select>
                    <button className="rounded-[9px] bg-electric px-3.5 py-2 text-[13px] font-bold">Salvează</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === "verificari" && (
        (checks ?? []).length === 0 ? (
          <EmptyState icon={HardHat} title="Nicio verificare încă" description="Pe telefon, înainte de „Pornește lucrul”, tehnicianul bifează lista de siguranță a lucrării (electric, gaze, fotovoltaic). Apar aici." />
        ) : (
          <div className="overflow-x-auto rounded-[13px] border border-border bg-white">
            <table className="w-full min-w-[720px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#f9fafb] text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Când</th><th className="px-4 py-3">Cine</th><th className="px-4 py-3">Lucrarea</th><th className="px-4 py-3">Lista</th><th className="px-4 py-3">Rezultat</th>
                </tr>
              </thead>
              <tbody>
                {(checks ?? []).map((c) => {
                  const tpl = TEMPLATES[c.template as Template] ?? TEMPLATES.general;
                  const items = (c.items ?? {}) as Record<string, boolean>;
                  const missing = tpl.items.filter((i) => items[i.id] !== true);
                  return (
                    <tr key={c.id} className="border-t border-[#f2f4f7] align-top">
                      <td className="whitespace-nowrap px-4 py-3">{when(c.checked_at)}</td>
                      <td className="px-4 py-3">{c.profiles?.full_name ?? "—"}</td>
                      <td className="px-4 py-3"><Link href={`/lucrari/${c.job_id}`} className="text-electric">#{c.jobs?.display_number} {c.jobs?.title}</Link></td>
                      <td className="px-4 py-3">{tpl.label} · {tpl.items.length} puncte</td>
                      <td className="px-4 py-3">{c.all_ok && !missing.length ? <span className="font-semibold text-success">Toate bifate</span> : <span className="font-semibold text-danger">Lipsă: {missing.map((m) => m.text.split(" ").slice(0, 4).join(" ")).join("; ")}</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "bad" | "warn" | null }) {
  return (
    <div className={`rounded-2xl border p-4 ${tone === "bad" ? "border-danger/40 bg-danger-bg" : tone === "warn" ? "border-warning/40 bg-warning-bg" : "border-border bg-white"}`}>
      <div className="text-xs font-semibold text-muted">{label}</div>
      <div className="mt-1 text-[28px] font-extrabold">{value}</div>
    </div>
  );
}
