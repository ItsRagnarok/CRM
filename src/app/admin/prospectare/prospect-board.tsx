"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useMemo, useState, useTransition } from "react";
import { Building2, Download, ExternalLink, Mail, Pause, Play, Plus, Search, UserRound } from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";
import { CAMPAIGN_DOMAINS, DEFAULT_CAEN, PROSPECT_STATUSES, SIZE_BUCKETS, sizeBucket, toCsv } from "@/lib/prospect";
import { approveCompanies, rejectCompanies, restoreCompanies, saveCampaign, setCampaignStatus } from "./actions";

type Campaign = Database["public"]["Tables"]["prospect_campaigns"]["Row"];
type Person = { id: string; name: string; role: string | null; email: string | null; email_status: string; linkedin: string | null; source_url: string | null };
type Company = Database["public"]["Tables"]["prospect_companies"]["Row"] & { prospect_people: Person[] };
type Run = Database["public"]["Tables"]["prospect_runs"]["Row"];
type EmailItem = { email: string; kind?: string; page?: string };

const input = "w-full rounded-[10px] border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-purple";
const label = "mb-1 block text-[12px] font-semibold text-muted";
const btn = "inline-flex items-center gap-1.5 rounded-[10px] border border-border bg-white px-3.5 py-2 text-[13px] font-bold disabled:opacity-50";
const btnPrimary = "inline-flex items-center gap-1.5 rounded-[10px] bg-electric px-3.5 py-2 text-[13px] font-bold text-[#0a0d0a] disabled:opacity-50";
const card = "rounded-[14px] border border-border bg-white p-4";

const REJECT_REASONS = ["Prea mică", "Nu are echipe pe teren", "Altă activitate", "Distribuitor sau rețea mare", "Deja în discuții", "Site sau date greșite"];
const emailsOf = (c: Company) => (Array.isArray(c.emails) ? (c.emails as EmailItem[]) : []);
const hasEmail = (c: Company) => emailsOf(c).length > 0 || c.prospect_people.some((p) => p.email);
const lei = (n: number | null) => (n == null ? "—" : n >= 1e6 ? `${(n / 1e6).toLocaleString("ro-RO", { maximumFractionDigits: 1 })} mil. lei` : `${Math.round(n / 1000).toLocaleString("ro-RO")} mii lei`);
const when = (iso: string) => new Date(iso).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function Score({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted">—</span>;
  const tone = value >= 75 ? "bg-success-bg text-success" : value >= 50 ? "bg-warning-bg text-warning" : "bg-neutral-bg text-muted";
  return <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-bold ${tone}`} title="Cât de bine se potrivește cu campania, după agent">{value}</span>;
}

function Bars({ title, rows }: { title: string; rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <div className={card}>
      <h3 className="text-[13px] font-extrabold">{title}</h3>
      <ul className="mt-2 flex flex-col gap-1.5">
        {rows.map(([k, v]) => (
          <li key={k} className="grid grid-cols-[110px_1fr_36px] items-center gap-2 text-[12.5px]">
            <span className="truncate">{k}</span>
            <span className="h-2 rounded-full bg-neutral-bg"><span className="block h-2 rounded-full bg-foreground/70" style={{ width: `${(v / max) * 100}%` }} /></span>
            <span className="text-right tabular-nums text-muted">{v}</span>
          </li>
        ))}
        {!rows.length && <li className="text-[12.5px] text-muted">Încă nimic.</li>}
      </ul>
    </div>
  );
}

function CampaignForm({ campaign, onSaved }: { campaign: Campaign | null; onSaved: (id: string) => void }) {
  const [domain, setDomain] = useState(campaign?.domain ?? "gaze");
  const [state, run, pending] = useActionState(async (p: { error?: string; ok?: boolean; id?: string } | undefined, fd: FormData) => {
    const r = await saveCampaign(campaign?.id ?? null, p, fd);
    if (r?.ok && r.id) onSaved(r.id);
    return r;
  }, undefined);
  const id = campaign?.id ?? "new";
  const lines = (a: string[] | undefined) => (a ?? []).join("\n");
  const field = (name: string, title: string, hint: string, value: string, rows = 2, max = 1000) => (
    <div>
      <label htmlFor={`${name}-${id}`} className={label}>{title}</label>
      <textarea id={`${name}-${id}`} name={name} rows={rows} maxLength={max} defaultValue={value} className={input} />
      <p className="mt-1 text-[11.5px] text-muted">{hint}</p>
    </div>
  );
  return (
    <form action={run} className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
        <div><label htmlFor={`name-${id}`} className={label}>Numele campaniei</label><input id={`name-${id}`} name="name" required maxLength={120} defaultValue={campaign?.name ?? ""} placeholder="ex. Instalatori gaze 10–300 angajați" className={input} /></div>
        <div>
          <label htmlFor={`domain-${id}`} className={label}>Domeniu</label>
          <select id={`domain-${id}`} name="domain" value={domain} onChange={(e) => setDomain(e.target.value)} className={input}>{CAMPAIGN_DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}</select>
        </div>
      </div>
      {field("offer", "Ce oferi", "Ce rezolvă ElectroField pentru firmele astea, într-o frază.", campaign?.offer ?? "")}
      {field("problem", "Problema clientului", "Durerea pe care o caută agentul în ce scrie firma despre ea.", campaign?.customer_problem ?? "")}
      {field("targeting", "Ce firme căutăm", "Descrierea în cuvinte: mărime, echipe pe teren, tip de lucrări, ce excludem.", campaign?.targeting ?? "", 3, 2000)}
      <div className="grid gap-3 sm:grid-cols-2">
        {field("positive", "Criterii pozitive (unul pe rând)", "ex. Autorizație ANRE EDIB; Echipe proprii de execuție; Lucrări la blocuri", lines(campaign?.positive_criteria), 4, 3000)}
        {field("negative", "Criterii negative (unul pe rând)", "ex. Operator de distribuție; Doar magazin; Doar proiectare", lines(campaign?.negative_criteria), 4, 3000)}
        {field("examples", "Firme exemplu (una pe rând)", "Firme care s-ar potrivi perfect. Agentul caută firme asemănătoare.", lines(campaign?.example_clients), 3, 3000)}
        {field("keywords", "Cuvinte cheie (pentru căutare)", "ex. verificări revizii gaze; montaj centrale; branșamente", lines(campaign?.keywords), 3, 3000)}
      </div>
      {field("roles", "Oamenii căutați", "Rolurile cu care vrei să vorbești: patron, administrator, director tehnic, șef de șantier.", campaign?.target_roles ?? "")}
      <div className="grid gap-3 sm:grid-cols-4">
        <div><label htmlFor={`min-${id}`} className={label}>Minim angajați (ANAF)</label><input id={`min-${id}`} name="minEmployees" inputMode="numeric" defaultValue={campaign?.min_employees ?? 10} className={input} /></div>
        <div><label htmlFor={`max-${id}`} className={label}>Maxim angajați</label><input id={`max-${id}`} name="maxEmployees" inputMode="numeric" defaultValue={campaign?.max_employees ?? 300} className={input} /></div>
        <div><label htmlFor={`daily-${id}`} className={label}>Firme noi pe rulare</label><input id={`daily-${id}`} name="daily" inputMode="numeric" defaultValue={campaign?.daily_target ?? 30} className={input} /></div>
        <div><label htmlFor={`caen-${id}`} className={label}>Coduri CAEN</label><input id={`caen-${id}`} name="caen" key={domain} defaultValue={(campaign && campaign.domain === domain ? campaign.caen_codes : DEFAULT_CAEN[domain] ?? []).join(", ")} className={input} /></div>
      </div>
      {field("counties", "Județe (gol = toată țara)", "ex. Cluj, Bihor, București", (campaign?.counties ?? []).join(", "), 1, 1000)}
      {field("agentNotes", "Note pentru agent", "Reguli învățate: ce să nu mai aducă, unde să caute. Agentul le citește la fiecare rulare, împreună cu motivele de respingere.", campaign?.agent_notes ?? "", 3, 4000)}
      {state?.error && <p role="alert" className="text-[12.5px] font-semibold text-danger">{state.error}</p>}
      {state?.ok && <p role="status" className="text-[12.5px] font-semibold text-success">Salvat.</p>}
      <div><button type="submit" disabled={pending} className={btnPrimary}>{pending ? "Se salvează…" : campaign ? "Salvează campania" : "Creează campania"}</button></div>
    </form>
  );
}

function CompanyRow({ c, selected, onSelect, open, onOpen }: { c: Company; selected: boolean; onSelect: (v: boolean) => void; open: boolean; onOpen: () => void }) {
  const emails = emailsOf(c);
  return (
    <>
      <tr className={`border-t border-border align-top ${open ? "bg-neutral-bg/50" : ""}`}>
        <td className="py-2.5 pl-3"><input type="checkbox" aria-label={`Alege ${c.name}`} checked={selected} onChange={(e) => onSelect(e.target.checked)} disabled={c.status === "importat"} /></td>
        <td className="py-2.5 pr-3">
          <button type="button" onClick={onOpen} className="text-left text-[13px] font-bold hover:underline" aria-expanded={open}>{c.name}</button>
          {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[12px] text-muted hover:underline">{c.host ?? c.website}<ExternalLink className="h-3 w-3" /></a>}
        </td>
        <td className="hidden max-w-[320px] py-2.5 pr-3 text-[12.5px] text-muted md:table-cell"><span className="line-clamp-2">{c.description ?? "—"}</span></td>
        <td className="py-2.5 pr-3 text-[12.5px]">{c.county ?? "—"}</td>
        <td className="py-2.5 pr-3 text-[12.5px] tabular-nums">{c.employees ?? "—"}</td>
        <td className="hidden py-2.5 pr-3 text-[12.5px] tabular-nums sm:table-cell">{c.caen ?? "—"}</td>
        <td className="py-2.5 pr-3"><Score value={c.fit_score} /></td>
        <td className="py-2.5 pr-3 text-[12.5px]">{hasEmail(c) ? <span className="inline-flex items-center gap-1 font-semibold text-success"><Mail className="h-3.5 w-3.5" />{emails.length + c.prospect_people.filter((p) => p.email).length}</span> : <span className="text-muted">fără</span>}</td>
      </tr>
      {open && (
        <tr className="bg-neutral-bg/50">
          <td />
          <td colSpan={7} className="pb-4 pr-3 text-[12.5px]">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                {c.fit_reason && <p><b>De ce se potrivește:</b> {c.fit_reason}</p>}
                {c.signals.length > 0 && <div className="flex flex-wrap gap-1.5">{c.signals.map((s) => <span key={s} className="rounded-full border border-border bg-white px-2 py-0.5 text-[11.5px] font-semibold">{s}</span>)}</div>}
                <p className="text-muted">ANAF {c.fin_year ?? ""}: {c.employees ?? "?"} angajați · cifră de afaceri {lei(c.turnover)} · profit {lei(c.profit)} · CUI {c.cui ?? "—"}</p>
                <p className="text-muted">{[c.address, c.phone].filter(Boolean).join(" · ") || "Fără adresă și telefon"}</p>
                <p className="text-muted">Sursa: {c.source}{c.source_detail ? ` — ${c.source_detail}` : ""}</p>
                {c.reject_reason && <p className="font-semibold text-danger">Respins: {c.reject_reason}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <div>
                  <b>Oameni</b>
                  <ul className="mt-1 flex flex-col gap-1">
                    {c.prospect_people.map((p) => (
                      <li key={p.id} className="flex flex-wrap items-center gap-x-2"><UserRound className="h-3.5 w-3.5 text-muted" />{p.name}{p.role && <span className="text-muted">· {p.role}</span>}
                        {p.email && <span className={p.email_status === "ghicit" ? "text-warning" : "text-success"}>{p.email}{p.email_status === "ghicit" ? " (ghicit, neverificat)" : ""}</span>}
                        {p.linkedin && <a href={p.linkedin} target="_blank" rel="noreferrer" className="underline">LinkedIn</a>}
                      </li>
                    ))}
                    {!c.prospect_people.length && <li className="text-muted">Niciun nume găsit.</li>}
                  </ul>
                </div>
                <div>
                  <b>Adrese de pe site</b>
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {emails.map((e) => <li key={e.email}>{e.email} <span className="text-muted">({e.kind === "generic" ? "a firmei" : "a unui om"})</span></li>)}
                    {!emails.length && <li className="text-muted">Nicio adresă pe site.{c.mx === false ? " Domeniul nu primește e-mail." : ""}</li>}
                  </ul>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function ProspectBoard({ campaigns, counts, current, companies, runs }: {
  campaigns: Campaign[]; counts: Record<string, { total: number; pending: number }>; current: Campaign | null; companies: Company[]; runs: Run[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"firme" | "campanie" | "progres">(current ? "firme" : "campanie");
  const [creating, setCreating] = useState(!current);
  const [status, setStatus] = useState<string>("candidat");
  const [q, setQ] = useState("");
  const [onlyEmail, setOnlyEmail] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "err" } | null>(null);
  const [pending, start] = useTransition();

  const byStatus = useMemo(() => Object.fromEntries(PROSPECT_STATUSES.map((s) => [s.id, companies.filter((c) => c.status === s.id).length])), [companies]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return companies.filter((c) => c.status === status && (!onlyEmail || hasEmail(c)) &&
      (!needle || [c.name, c.host, c.county, c.city, c.description].some((v) => v?.toLowerCase().includes(needle))));
  }, [companies, status, q, onlyEmail]);
  const stats = useMemo(() => {
    const active = companies.filter((c) => c.status !== "respins");
    const counties = new Map<string, number>();
    const sizes = new Map<string, number>(SIZE_BUCKETS.map((b) => [b.id, 0]));
    for (const c of active) {
      counties.set(c.county ?? "necunoscut", (counties.get(c.county ?? "necunoscut") ?? 0) + 1);
      const b = sizeBucket(c.employees);
      sizes.set(b, (sizes.get(b) ?? 0) + 1);
    }
    const withPersonal = active.filter((c) => c.prospect_people.some((p) => p.email && p.email_status === "pe_site") || emailsOf(c).some((e) => e.kind === "personal")).length;
    const withAny = active.filter(hasEmail).length;
    const people = active.reduce((n, c) => n + c.prospect_people.length, 0);
    return {
      total: active.length, people, withAny, withPersonal, without: active.length - withAny,
      counties: [...counties.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
      sizes: [...sizes.entries()].filter(([, v]) => v > 0),
    };
  }, [companies]);

  const run = (fn: () => Promise<{ error?: string; added?: number; linked?: number; ok?: boolean } | undefined>, ok: (r: { added?: number; linked?: number }) => string) =>
    start(async () => {
      const r = await fn();
      if (r?.error) setMsg({ text: r.error, tone: "err" });
      else { setMsg({ text: ok(r ?? {}), tone: "ok" }); setSelected(new Set()); router.refresh(); }
    });

  const exportCsv = () => {
    const rows = shown.map((c) => ({
      ...c, emails_list: emailsOf(c).map((e) => e.email),
      people_list: c.prospect_people.map((p) => `${p.name}${p.role ? ` (${p.role})` : ""}${p.email ? ` <${p.email}>${p.email_status === "ghicit" ? " ghicit" : ""}` : ""}`),
    }));
    const csv = toCsv(rows, [
      { key: "name", label: "Firmă" }, { key: "cui", label: "CUI" }, { key: "website", label: "Site" }, { key: "county", label: "Județ" }, { key: "city", label: "Localitate" },
      { key: "employees", label: "Angajați" }, { key: "turnover", label: "Cifră de afaceri" }, { key: "caen", label: "CAEN" }, { key: "fit_score", label: "Scor" },
      { key: "fit_reason", label: "De ce" }, { key: "emails_list", label: "E-mailuri" }, { key: "people_list", label: "Oameni" }, { key: "phone", label: "Telefon" }, { key: "description", label: "Descriere" },
    ]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `prospectare-${(current?.name ?? "campanie").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const ids = [...selected];
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-4 p-4 md:flex-row md:p-6">
      <aside className="flex shrink-0 flex-col gap-1 md:w-[240px]" aria-label="Campanii">
        <h1 className="mb-1 text-[20px] font-extrabold">Prospectare</h1>
        {campaigns.map((x) => (
          <Link key={x.id} href={`/admin/prospectare?c=${x.id}`} aria-current={x.id === current?.id && !creating ? "page" : undefined}
            className={`flex items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-[13px] font-semibold ${x.id === current?.id && !creating ? "bg-neutral-bg" : "hover:bg-neutral-bg"}`}>
            <span className="flex min-w-0 items-center gap-2"><span className={`h-2 w-2 shrink-0 rounded-full ${x.status === "activa" ? "bg-success" : "bg-warning"}`} aria-label={x.status === "activa" ? "activă" : "în pauză"} /><span className="truncate">{x.name}</span></span>
            {counts[x.id]?.pending ? <span className="rounded-full bg-electric px-1.5 text-[11px] font-bold text-[#0a0d0a]" title="De verificat">{counts[x.id].pending}</span> : null}
          </Link>
        ))}
        <button type="button" onClick={() => { setCreating(true); setTab("campanie"); }} className="mt-1 flex items-center gap-2 rounded-[10px] px-3 py-2 text-left text-[13px] font-semibold text-muted hover:bg-neutral-bg"><Plus className="h-4 w-4" /> Campanie nouă</button>
      </aside>

      <main className="min-w-0 flex-1">
        {creating || !current ? (
          <section className={card}>
            <h2 className="mb-3 text-[16px] font-extrabold">Campanie nouă</h2>
            <CampaignForm campaign={null} onSaved={(id) => { setCreating(false); router.push(`/admin/prospectare?c=${id}`); }} />
            {current && <button type="button" onClick={() => setCreating(false)} className={`${btn} mt-3`}>Renunță</button>}
          </section>
        ) : (
          <>
            <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[20px] font-extrabold">{current.name}</h2>
                <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${current.status === "activa" ? "bg-success-bg text-success" : "bg-warning-bg text-warning"}`}>{current.status === "activa" ? "Activă" : "În pauză"}</span>
              </div>
              <button type="button" disabled={pending} className={current.status === "activa" ? btn : btnPrimary}
                onClick={() => run(() => setCampaignStatus(current.id, current.status === "activa" ? "pauza" : "activa"), () => (current.status === "activa" ? "Campania e în pauză: agentul nu mai caută pentru ea." : "Campania e activă: agentul o ia la următoarea rulare."))}>
                {current.status === "activa" ? <><Pause className="h-4 w-4" /> Pune pe pauză</> : <><Play className="h-4 w-4" /> Pornește căutarea</>}
              </button>
            </header>
            <div role="tablist" className="mb-3 flex gap-1 border-b border-border">
              {([["firme", `Firme ${stats.total}`], ["campanie", "Campanie"], ["progres", "Progres"]] as const).map(([k, t]) => (
                <button key={k} role="tab" aria-selected={tab === k} type="button" onClick={() => setTab(k)}
                  className={`-mb-px border-b-2 px-3 py-2 text-[13px] font-bold ${tab === k ? "border-foreground" : "border-transparent text-muted"}`}>{t}</button>
              ))}
            </div>
            {msg && <p role={msg.tone === "err" ? "alert" : "status"} className={`mb-3 text-[12.5px] font-semibold ${msg.tone === "err" ? "text-danger" : "text-success"}`}>{msg.text}</p>}

            {tab === "campanie" && <section className={card}><CampaignForm campaign={current} onSaved={() => router.refresh()} /></section>}

            {tab === "progres" && (
              <div className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-4">
                  {[["Firme găsite", stats.total], ["Oameni găsiți", stats.people], ["Cu adresă de e-mail", stats.withAny], ["Fără adresă", stats.without]].map(([t, v]) => (
                    <div key={t} className={card}><p className="text-[12px] font-semibold text-muted">{t}</p><p className="text-[28px] font-extrabold tabular-nums">{v}</p></div>
                  ))}
                </div>
                <p className="text-[12.5px] text-muted">{stats.withPersonal} firme au și adresa unui om (nu doar office@). Aprobate: {byStatus.importat ?? 0} · respinse: {byStatus.respins ?? 0}.</p>
                <div className={card}>
                  <h3 className="text-[13px] font-extrabold">Rulările agentului</h3>
                  <ul className="mt-2 flex flex-col gap-3">
                    {runs.map((r) => {
                      const s = (r.stats ?? {}) as Record<string, number>;
                      return (
                        <li key={r.id} className="border-t border-border pt-2 text-[12.5px] first:border-0 first:pt-0">
                          <p className="font-semibold">{when(r.started_at)} · {r.status === "gata" ? "gata" : r.status === "eroare" ? "eroare" : "în curs"}{s.adaugate != null ? ` · ${s.adaugate} firme noi din ${s.verificate ?? "?"} verificate` : ""}</p>
                          {r.summary && <p className="mt-0.5 whitespace-pre-line text-muted">{r.summary}</p>}
                        </li>
                      );
                    })}
                    {!runs.length && <li className="text-[12.5px] text-muted">Agentul n-a rulat încă pentru campania asta. Pune campania pe „Activă”: agentul o ia la următoarea rulare programată.</li>}
                  </ul>
                </div>
              </div>
            )}

            {tab === "firme" && (
              <div className="flex flex-col gap-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <Bars title="Județe" rows={stats.counties} />
                  <Bars title="Angajați (ANAF)" rows={stats.sizes} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {PROSPECT_STATUSES.map((s) => (
                    <button key={s.id} type="button" aria-pressed={status === s.id} onClick={() => { setStatus(s.id); setSelected(new Set()); }}
                      className={`rounded-full border px-3 py-1 text-[12.5px] font-semibold ${status === s.id ? "border-foreground bg-foreground text-background" : "border-border bg-white"}`}>{s.label} {byStatus[s.id] ?? 0}</button>
                  ))}
                  <label className="ml-1 flex items-center gap-1.5 text-[12.5px]"><input type="checkbox" checked={onlyEmail} onChange={(e) => setOnlyEmail(e.target.checked)} /> doar cu e-mail</label>
                  <div className="relative ml-auto">
                    <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
                    <label htmlFor="pq" className="sr-only">Caută</label>
                    <input id="pq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Caută firmă, oraș…" className={`${input} pl-8 sm:w-[220px]`} />
                  </div>
                  <button type="button" onClick={exportCsv} disabled={!shown.length} className={btn}><Download className="h-4 w-4" /> CSV</button>
                </div>

                {ids.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-border bg-white p-2.5 text-[12.5px]">
                    <b>{ids.length} alese</b>
                    {status !== "respins" && <button type="button" disabled={pending} className={btnPrimary} onClick={() => run(() => approveCompanies(ids), (r) => `${r.added ?? 0} firme mutate în Leads la „De contactat”${r.linked ? `, ${r.linked} erau deja acolo` : ""}.`)}>Aprobă → Leads</button>}
                    {status !== "respins" && <>
                      <label htmlFor="rr" className="sr-only">Motivul respingerii</label>
                      <select id="rr" value={reason} onChange={(e) => setReason(e.target.value)} className={`${input} w-auto`}>{REJECT_REASONS.map((r) => <option key={r}>{r}</option>)}</select>
                      <button type="button" disabled={pending} className={btn} onClick={() => run(() => rejectCompanies(ids, reason), () => "Respinse. Agentul ține cont de motiv la următoarea rulare.")}>Respinge</button>
                    </>}
                    {status === "respins" && <button type="button" disabled={pending} className={btn} onClick={() => run(() => restoreCompanies(ids), () => "Readuse la „De verificat”.")}>Readu la verificat</button>}
                  </div>
                )}

                <div className="overflow-x-auto rounded-[14px] border border-border bg-white">
                  <table className="w-full min-w-[640px] text-left">
                    <thead className="text-[11.5px] uppercase tracking-wide text-muted">
                      <tr>
                        <th className="py-2 pl-3"><input type="checkbox" aria-label="Alege toate" checked={shown.length > 0 && shown.filter((c) => c.status !== "importat").every((c) => selected.has(c.id))}
                          onChange={(e) => setSelected(e.target.checked ? new Set(shown.filter((c) => c.status !== "importat").map((c) => c.id)) : new Set())} /></th>
                        <th className="py-2 pr-3">Firmă</th><th className="hidden py-2 pr-3 md:table-cell">Ce face</th><th className="py-2 pr-3">Județ</th>
                        <th className="py-2 pr-3">Angajați</th><th className="hidden py-2 pr-3 sm:table-cell">CAEN</th><th className="py-2 pr-3">Scor</th><th className="py-2 pr-3">E-mail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((c) => (
                        <CompanyRow key={c.id} c={c} open={openId === c.id} onOpen={() => setOpenId(openId === c.id ? null : c.id)}
                          selected={selected.has(c.id)} onSelect={(v) => setSelected((s) => { const n = new Set(s); if (v) n.add(c.id); else n.delete(c.id); return n; })} />
                      ))}
                    </tbody>
                  </table>
                  {!shown.length && <p className="flex items-center gap-2 p-4 text-[12.5px] text-muted"><Building2 className="h-4 w-4" /> Nicio firmă aici.</p>}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
