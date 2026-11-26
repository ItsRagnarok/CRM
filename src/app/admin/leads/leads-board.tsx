"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Building2, CalendarClock, ClipboardCopy, Search, Target, Layers, UserRound, X, Plus } from "lucide-react";
import {
  EVENT_KINDS, LEAD_DOMAINS, LEAD_WANTS, wantLabel, LEAD_SOURCES, LEAD_STAGES, OPEN_STAGES, buildBrief, dayMonth, domainLabel, followUpState, formatLei,
  isOpenStage, kindLabel, nextStage, pipelineValue, sourceLabel, stageLabel, winRate, type BriefLead,
} from "@/lib/leads";
import { addLead, addLeadEvent, deleteLead, importBookings, importLeadsFile, setFollowUp, setLeadStage, updateLead } from "./actions";

type Lead = BriefLead & { id: string; booking_id: string | null; organization_id: string | null };
type LeadEvent = { id: string; lead_id: string; kind: string; body: string; created_at: string };

const input = "w-full rounded-[10px] border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-purple";
const label = "mb-1 block text-[12px] font-semibold text-muted";
const btn = "rounded-[10px] border border-border bg-white px-3.5 py-2 text-[13px] font-bold disabled:opacity-50";
const btnPrimary = "rounded-[10px] bg-electric px-3.5 py-2 text-[13px] font-bold text-[#0a0d0a] disabled:opacity-50";

const when = (iso: string) => new Date(iso).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function FollowTag({ lead, today }: { lead: Lead; today: string }) {
  const s = followUpState(lead.next_follow_up, today, lead.stage);
  if (s === "fara" || !lead.next_follow_up) return null;
  const tone = s === "intarziat" ? "bg-danger-bg text-danger" : s === "azi" ? "bg-warning-bg text-warning" : "bg-neutral-bg text-muted";
  const text = s === "intarziat" ? `Întârziat · ${dayMonth(lead.next_follow_up)}` : s === "azi" ? "Azi" : `Reluare ${dayMonth(lead.next_follow_up)}`;
  return <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${tone}`}>{text}</span>;
}

function WantChips({ wants, className = "" }: { wants: string[]; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`} aria-label="Ce a cerut">
      {wants.map((w) => <span key={w} className="rounded-full bg-info-bg px-2.5 py-0.5 text-[11.5px] font-bold text-info">{wantLabel(w)}</span>)}
    </div>
  );
}

function LeadForm({ lead, onDone }: { lead?: Lead; onDone: () => void }) {
  const action = lead ? updateLead.bind(null, lead.id) : addLead;
  const [state, run, pending] = useActionState(async (p: { error?: string; ok?: boolean } | undefined, fd: FormData) => {
    const r = await action(p, fd);
    if (r?.ok) onDone();
    return r;
  }, undefined);
  const id = lead?.id ?? "new";
  return (
    <form action={run} className="flex flex-col gap-3">
      <div><label htmlFor={`c-${id}`} className={label}>Firmă</label><input id={`c-${id}`} name="company" required maxLength={160} defaultValue={lead?.company_name} className={input} /></div>
      <div className="grid grid-cols-2 gap-2.5">
        <div><label htmlFor={`p-${id}`} className={label}>Persoană</label><input id={`p-${id}`} name="contact" maxLength={120} defaultValue={lead?.contact_name ?? ""} className={input} /></div>
        <div><label htmlFor={`t-${id}`} className={label}>Tehnicieni</label><input id={`t-${id}`} name="teamSize" inputMode="numeric" maxLength={5} defaultValue={lead?.team_size ?? ""} className={input} /></div>
        <div><label htmlFor={`ph-${id}`} className={label}>Telefon</label><input id={`ph-${id}`} name="phone" type="tel" maxLength={40} defaultValue={lead?.phone ?? ""} className={input} /></div>
        <div><label htmlFor={`e-${id}`} className={label}>E-mail</label><input id={`e-${id}`} name="email" type="email" maxLength={160} defaultValue={lead?.email ?? ""} className={input} /></div>
        <div>
          <label htmlFor={`s-${id}`} className={label}>Sursă</label>
          <select id={`s-${id}`} name="source" defaultValue={lead?.source ?? "altul"} className={input}>{LEAD_SOURCES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
        </div>
        <div><label htmlFor={`v-${id}`} className={label}>Valoare lei / lună</label><input id={`v-${id}`} name="value" inputMode="decimal" maxLength={12} defaultValue={lead?.estimated_value ?? ""} className={input} /></div>
      </div>
      <fieldset className="flex flex-wrap gap-4 text-[13px]">
        <legend className={label}>Domenii</legend>
        {LEAD_DOMAINS.map((d) => <label key={d.id} className="flex items-center gap-2"><input type="checkbox" name="domains" value={d.id} defaultChecked={lead?.domains.includes(d.id)} /> {d.label}</label>)}
      </fieldset>
      <div><label htmlFor={`f-${id}`} className={label}>De reluat la</label><input id={`f-${id}`} name="followUp" type="date" defaultValue={lead?.next_follow_up ?? ""} className={input} /></div>
      <div><label htmlFor={`ct-${id}`} className={label}>Ce folosesc acum (Excel, caiete, altă aplicație)</label><textarea id={`ct-${id}`} name="currentTools" rows={2} maxLength={1000} defaultValue={lead?.current_tools ?? ""} className={input} /></div>
      <div><label htmlFor={`pr-${id}`} className={label}>Nevoi și context (doar ce au spus sau ce e verificat)</label><textarea id={`pr-${id}`} name="problems" rows={3} maxLength={2000} defaultValue={lead?.problems ?? ""} className={input} /></div>
      <fieldset className="flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
        <legend className={label}>Ce a cerut</legend>
        {LEAD_WANTS.map((w) => <label key={w.id} className="flex items-center gap-2"><input type="checkbox" name="wants" value={w.id} defaultChecked={lead?.wants?.includes(w.id)} /> {w.label}</label>)}
      </fieldset>
      <div><label htmlFor={`lr-${id}`} className={label}>Ultimul lor răspuns (cuvânt cu cuvânt)</label><textarea id={`lr-${id}`} name="lastReply" rows={3} maxLength={2000} defaultValue={lead?.last_reply ?? ""} className={input} /></div>
      {state?.error && <p role="alert" className="text-[12.5px] font-semibold text-danger">{state.error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={btnPrimary}>{pending ? "Se salvează…" : lead ? "Salvează" : "Adaugă leadul"}</button>
        <button type="button" onClick={onDone} className={btn}>Renunță</button>
      </div>
    </form>
  );
}

function Panel({ lead, events, today, onClose }: { lead: Lead; events: LeadEvent[]; today: string; onClose: () => void }) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [losing, setLosing] = useState(false);
  const [kind, setKind] = useState("nota");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "err" } | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const next = nextStage(lead.stage);
  const open = isOpenStage(lead.stage);
  const step = OPEN_STAGES.indexOf(lead.stage as (typeof OPEN_STAGES)[number]);

  const run = (fn: () => Promise<{ error?: string; ok?: boolean } | undefined>, okText?: string) =>
    start(async () => {
      const r = await fn();
      setMsg(r?.error ? { text: r.error, tone: "err" } : okText ? { text: okText, tone: "ok" } : null);
    });

  const copyBrief = async () => {
    const text = buildBrief(lead, events, today);
    try {
      await navigator.clipboard.writeText(text);
      setFallback(null);
      setMsg({ text: "Copiat. Lipește-l în chatul cu Claude.", tone: "ok" });
    } catch {
      setFallback(text);
      setMsg({ text: "Nu am putut copia automat. Selectează textul de mai jos.", tone: "err" });
    }
  };

  return (
    <aside className="min-w-0 fixed inset-0 z-50 overflow-y-auto bg-white p-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] xl:static xl:z-auto xl:overflow-visible xl:rounded-[18px] xl:border xl:border-border xl:p-5 xl:sticky xl:top-4 xl:self-start" data-lead-panel aria-label={`Lead ${lead.company_name}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words text-[19px] font-extrabold">{lead.company_name}</h2>
          <p className="text-[13px] text-muted">{stageLabel(lead.stage)} · {sourceLabel(lead.source)}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Închide fișa" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-neutral-bg xl:h-8 xl:w-8"><X className="h-5 w-5" /></button>
      </div>
      {open && <div className="mt-3 flex gap-1" aria-hidden="true">{OPEN_STAGES.map((s, i) => <i key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-foreground" : "bg-border"}`} />)}</div>}

      {editing ? <div className="mt-4"><LeadForm lead={lead} onDone={() => setEditing(false)} /></div> : (
        <>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
            <dt className="text-muted">Persoană</dt><dd>{lead.contact_name ?? "—"}</dd>
            <dt className="text-muted">Telefon</dt><dd className="select-all">{lead.phone ?? "—"}</dd>
            <dt className="text-muted">E-mail</dt><dd className="select-all break-all">{lead.email ?? "—"}</dd>
            <dt className="text-muted">Echipă</dt><dd>{lead.team_size ? `${lead.team_size} tehnicieni` : "—"}</dd>
            <dt className="text-muted">Domenii</dt><dd>{lead.domains.length ? lead.domains.map(domainLabel).join(", ") : "—"}</dd>
            <dt className="text-muted">Valoare</dt><dd className="font-bold">{lead.estimated_value == null ? "—" : `${formatLei(Number(lead.estimated_value))} / lună`}</dd>
            <dt className="text-muted">Reluare</dt>
            <dd className="flex flex-wrap items-center gap-2">
              <FollowTag lead={lead} today={today} />
              {open && <input type="date" aria-label="Data reluării" defaultValue={lead.next_follow_up ?? ""} onChange={(e) => run(() => setFollowUp(lead.id, e.target.value))} className="rounded-lg border border-border bg-white px-2 py-1 text-[12.5px]" />}
            </dd>
          </dl>
          {(lead.wants ?? []).length > 0 && <WantChips wants={lead.wants ?? []} className="mt-3" />}
          {lead.last_reply && (
            <blockquote className="mt-3 whitespace-pre-line rounded-[12px] border-l-4 border-border bg-neutral-bg p-3 text-[13px]">
              <div className="mb-1 text-[11.5px] font-bold uppercase tracking-wide text-muted">Ultimul lor răspuns</div>
              {lead.last_reply}
            </blockquote>
          )}
          {(lead.current_tools || lead.problems) && (
            <div className="mt-3 flex flex-col gap-2 rounded-[12px] bg-neutral-bg p-3 text-[13px]">
              {lead.current_tools && <p><span className="font-bold">Folosesc acum:</span> {lead.current_tools}</p>}
              {lead.problems && <p className="whitespace-pre-line"><span className="font-bold">Nevoi și context:</span> {lead.problems}</p>}
            </div>
          )}
          {lead.stage === "pierdut" && lead.lost_reason && <p className="mt-3 text-[13px] text-muted">Motiv pierdut: {lead.lost_reason}</p>}
        </>
      )}

      {!editing && (
        <div className="mt-4 flex flex-wrap gap-2">
          {next && <button type="button" disabled={pending} onClick={() => run(() => setLeadStage(lead.id, next))} className={btnPrimary}>Mută la „{stageLabel(next)}”</button>}
          {lead.stage === "negociere" && <button type="button" disabled={pending} onClick={() => run(() => setLeadStage(lead.id, "castigat"))} className={btnPrimary}>Câștigat</button>}
          {lead.stage === "castigat" && !lead.organization_id && (
            <Link href="/admin/companii/noua" className={btnPrimary}>Creează compania</Link>
          )}
          {open && <button type="button" disabled={pending} onClick={() => setLosing((v) => !v)} className={btn}>Pierdut</button>}
          {!open && <button type="button" disabled={pending} onClick={() => run(() => setLeadStage(lead.id, "nou"))} className={btn}>Redeschide</button>}
          <button type="button" onClick={() => setEditing(true)} className={btn}>Editează</button>
        </div>
      )}
      {losing && (
        <form className="mt-2 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); run(() => setLeadStage(lead.id, "pierdut", reason)); setLosing(false); setReason(""); }}>
          <label htmlFor="lost-reason" className="sr-only">Motivul</label>
          <input id="lost-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="De ce l-ai pierdut?" className={`${input} flex-1`} />
          <button type="submit" className={btn}>Salvează</button>
        </form>
      )}

      <section className="mt-5 rounded-[14px] border border-border bg-neutral-bg p-3.5" aria-label="Pentru Claude">
        <h3 className="text-[13.5px] font-extrabold">Întreabă Claude despre acest lead</h3>
        <p className="mt-1 text-[12.5px] text-muted">Copiază datele, istoricul și ce poate platforma, apoi lipește-le în chatul tău cu Claude. El îți spune ce faci, când și ce discuți.</p>
        <button type="button" onClick={copyBrief} className={`${btnPrimary} mt-2.5 inline-flex items-center gap-2`}><ClipboardCopy className="h-4 w-4" /> Copiază pentru Claude</button>
        {fallback && <textarea readOnly value={fallback} rows={8} aria-label="Textul de copiat" onFocus={(e) => e.currentTarget.select()} className={`${input} mt-2 font-mono text-[11.5px]`} />}
      </section>

      <section className="mt-5" aria-label="Notițe">
        <h3 className="text-[13.5px] font-extrabold">Notă sau mesaj</h3>
        <form className="mt-2 flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); run(async () => { const r = await addLeadEvent(lead.id, kind, body); if (r?.ok) setBody(""); return r; }); }}>
          <div className="flex gap-2">
            <label htmlFor="ev-kind" className="sr-only">Tip</label>
            <select id="ev-kind" value={kind} onChange={(e) => setKind(e.target.value)} className={`${input} w-auto`}>{EVENT_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}</select>
          </div>
          <label htmlFor="ev-body" className="sr-only">Ce s-a întâmplat</label>
          <textarea id="ev-body" value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={2000} placeholder="Ce a zis, ce ai promis, ce urmează…" className={input} />
          <button type="submit" disabled={pending || !body.trim()} className={`${btn} self-end`}>Adaugă în istoric</button>
        </form>
      </section>

      {msg && <p role={msg.tone === "err" ? "alert" : "status"} className={`mt-3 text-[12.5px] font-semibold ${msg.tone === "err" ? "text-danger" : "text-success"}`}>{msg.text}</p>}

      <section className="mt-5" aria-label="Istoric">
        <h3 className="text-[13.5px] font-extrabold">Istoric</h3>
        {events.length === 0 ? <p className="mt-2 text-[13px] text-muted">Nimic notat încă.</p> : (
          <ul className="mt-2 flex flex-col gap-3">
            {events.map((e) => (
              <li key={e.id} className="border-l-2 border-border pl-3 text-[13px]">
                <div className="text-[11.5px] text-muted">{when(e.created_at)} · {kindLabel(e.kind)}</div>
                <p className="whitespace-pre-line">{e.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button type="button" disabled={pending} onClick={() => { if (window.confirm(`Ștergi leadul ${lead.company_name}? Se șterge și istoricul.`)) run(() => deleteLead(lead.id)); }} className="mt-5 text-[12.5px] font-semibold text-danger">Șterge leadul</button>
    </aside>
  );
}

export function LeadsBoard({ leads, events, today }: { leads: Lead[]; events: LeadEvent[]; today: string }) {
  const [view, setView] = useState<"board" | "list">("board");
  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [due, setDue] = useState("");
  // Filtrul ales din cardurile de sus: deschise, cu valoare, închise (câștigate sau pierdute).
  const [only, setOnly] = useState<"" | "open" | "valoare" | "closed">("");
  const listRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | "new" | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importing, startImport] = useTransition();

  const byLead = useMemo(() => {
    const m = new Map<string, LeadEvent[]>();
    for (const e of events) m.set(e.lead_id, [...(m.get(e.lead_id) ?? []), e]);
    return m;
  }, [events]);

  const filtered = leads.filter((l) => {
    const text = `${l.company_name} ${l.contact_name ?? ""} ${l.phone ?? ""}`.toLowerCase();
    const f = followUpState(l.next_follow_up, today, l.stage);
    const inOnly = !only || (only === "open" ? isOpenStage(l.stage) : only === "valoare" ? isOpenStage(l.stage) && l.estimated_value != null && Number(l.estimated_value) > 0 : !isOpenStage(l.stage));
    return inOnly && (!q || text.includes(q.toLowerCase())) && (!source || l.source === source) && (!due || (due === "azi" ? f === "azi" || f === "intarziat" : f === due));
  });
  const open = leads.filter((l) => isOpenStage(l.stage));
  const pipeline = pipelineValue(leads);
  const dueCount = leads.filter((l) => { const f = followUpState(l.next_follow_up, today, l.stage); return f === "azi" || f === "intarziat"; }).length;
  const rate = winRate(leads);
  const won = leads.filter((l) => l.stage === "castigat").length;
  const lost = leads.filter((l) => l.stage === "pierdut").length;
  // Click în afara fișei și a cardurilor (sau Escape) închide fișa, ca o deselectare.
  useEffect(() => {
    if (!selected) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as Element | null;
      if (!el || !el.isConnected || el.closest("[data-lead-panel], [data-lead-item]")) return;
      setSelected(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [selected]);
  const current = selected && selected !== "new" ? leads.find((l) => l.id === selected) ?? null : null;

  /** Un card de sus duce la lista filtrată exact pe ce numără, și derulează până la ea. */
  const show = (next: { only?: typeof only; due?: string }) => {
    setQ(""); setSource(""); setOnly(next.only ?? ""); setDue(next.due ?? ""); setView("list");
    requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const kpi = (icon: React.ReactNode, title: string, value: string, sub: string, go: () => void, active: boolean) => (
    <button type="button" onClick={go} aria-pressed={active} className={`flex items-start gap-3 rounded-[16px] border bg-white p-3.5 text-left transition-colors hover:border-foreground sm:items-center sm:gap-3.5 sm:p-4 ${active ? "border-foreground ring-1 ring-foreground" : "border-border"}`}>
      <span className="hidden text-muted sm:block">{icon}</span>
      <div className="min-w-0"><div className="text-[12.5px] text-muted">{title}</div><div className="text-[22px] font-extrabold leading-tight tabular-nums sm:text-[24px]">{value}</div><div className="text-[12px] text-muted">{sub} · <span className="font-semibold text-foreground">vezi</span></div></div>
    </button>
  );
  const filterLabel = only === "open" ? "Leaduri deschise" : only === "valoare" ? "Deschise, cu valoare" : only === "closed" ? "Câștigate și pierdute" : due === "azi" ? "De reluat azi sau întârziate" : due === "intarziat" ? "Doar întârziate" : "";

  const card = (l: Lead) => (
    <button key={l.id} type="button" data-lead-item onClick={() => setSelected(l.id)} aria-current={selected === l.id} className={`mb-2 block w-full rounded-[14px] border bg-white p-3 text-left ${selected === l.id ? "border-foreground" : "border-border"}`}>
      <div className="flex items-center gap-2 font-bold"><Building2 className="h-4 w-4 shrink-0 text-muted" /><span className="break-words">{l.company_name}</span></div>
      {l.contact_name && <div className="mt-1 flex items-center gap-2 text-[12.5px] text-muted"><UserRound className="h-3.5 w-3.5 shrink-0" />{l.contact_name}</div>}
      <div className="mt-1 text-[12.5px] text-muted">{sourceLabel(l.source)}</div>
      {(l.wants ?? []).length > 0 && <WantChips wants={l.wants ?? []} className="mt-2" />}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><FollowTag lead={l} today={today} /><span className="ml-auto text-[12.5px] font-bold tabular-nums">{l.estimated_value == null ? "" : `${formatLei(Number(l.estimated_value))} / lună`}</span></div>
    </button>
  );

  return (
    <div className="mx-auto max-w-[1500px] p-4 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-extrabold">Leads</h1>
          <p className="mt-1 max-w-[70ch] text-[13.5px] text-muted">Firmele de instalatori care ar putea folosi Electrofield: de unde au venit, ce ți-au spus și când le reiei. Când un lead semnează, devine companie.</p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <button type="button" disabled={importing} onClick={() => startImport(async () => { const r = await importBookings(); setImportMsg(r.error ?? (r.added ? `${r.added} programări aduse.` : "Nimic nou de adus.")); })} className={btn}>Importă din Programări</button>
          <label className={`${btn} cursor-pointer ${importing ? "pointer-events-none opacity-50" : ""}`} title="Fișier JSON cu leaduri și istoricul lor (format electrofield-leads)">
            Importă din fișier
            <input type="file" accept=".json,application/json" className="sr-only" disabled={importing} onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              startImport(async () => {
                const r = await importLeadsFile(await file.text());
                if (r.error) { setImportMsg(r.error); return; }
                const parts = [`${r.added ?? 0} leaduri noi`, r.updated ? `${r.updated} completate` : "", `${r.events ?? 0} mesaje în istoric`].filter(Boolean).join(", ");
                setImportMsg(`Import gata: ${parts}.${r.warnings?.length ? ` Atenție: ${r.warnings.join(" ")}` : ""}`);
              });
            }} />
          </label>
          <button type="button" onClick={() => setSelected("new")} className={`${btnPrimary} inline-flex items-center gap-1.5`}><Plus className="h-4 w-4" /> Lead nou</button>
        </div>
      </div>
      {importMsg && <p role="status" className="mt-2 text-[12.5px] font-semibold text-muted">{importMsg}</p>}

      <section className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4" aria-label="Sumar">
        {kpi(<UserRound className="h-5 w-5" />, "Leaduri deschise", String(open.length), `din ${leads.length} în total`, () => show({ only: "open" }), only === "open")}
        {kpi(<Layers className="h-5 w-5" />, "Valoare în pipeline", formatLei(pipeline.total), `abonamente lunare, ${pipeline.counted} cu valoare`, () => show({ only: "valoare" }), only === "valoare")}
        {kpi(<CalendarClock className="h-5 w-5" />, "De reluat azi sau întârziate", String(dueCount), "apar și în meniu", () => show({ due: "azi" }), due === "azi" && !only)}
        {kpi(<Target className="h-5 w-5" />, "Rată de câștig", rate === null ? "—" : `${rate}%`, `${won} câștigate, ${lost} pierdute`, () => show({ only: "closed" }), only === "closed")}
      </section>

      <div ref={listRef} className="mt-5 flex scroll-mt-4 flex-wrap items-center gap-2.5 [&_select]:min-h-10 [&_input]:min-h-10">
        <div className="flex rounded-[10px] border border-border bg-white p-0.5" role="group" aria-label="Mod de afișare">
          {([["board", "Pe etape"], ["list", "Listă"]] as const).map(([id, text]) => (
            <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)} className={`rounded-[8px] px-3.5 py-1.5 text-[13px] font-bold ${view === id ? "bg-electric text-[#0a0d0a]" : "text-muted"}`}>{text}</button>
          ))}
        </div>
        <div className="relative min-w-[160px] flex-1 basis-full sm:basis-auto sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <label htmlFor="lead-search" className="sr-only">Caută</label>
          <input id="lead-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Caută firmă, persoană sau telefon" className={`${input} pl-9`} />
        </div>
        <label className="sr-only" htmlFor="lead-source">Sursă</label>
        <select id="lead-source" value={source} onChange={(e) => setSource(e.target.value)} className={`${input} w-auto`}><option value="">Toate sursele</option>{LEAD_SOURCES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
        <label className="sr-only" htmlFor="lead-due">Reluare</label>
        <select id="lead-due" value={due} onChange={(e) => setDue(e.target.value)} className={`${input} w-auto`}><option value="">Orice reluare</option><option value="azi">Azi sau întârziate</option><option value="intarziat">Doar întârziate</option></select>
        {filterLabel && (
          <button type="button" onClick={() => { setOnly(""); setDue(""); }} className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-[12.5px] font-bold text-background" aria-label={`Scoate filtrul ${filterLabel}`}>
            {filterLabel} · {filtered.length} <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className={`mt-4 grid grid-cols-1 gap-4 ${selected ? "xl:grid-cols-[minmax(0,1fr)_380px]" : ""}`}>
        <div className="min-w-0">
          {leads.length === 0 ? (
            <div className="rounded-[16px] border border-border bg-white p-8 text-center">
              <p className="font-bold">Niciun lead încă</p>
              <p className="mt-1 text-[13px] text-muted">Adaugă primul lead sau adu cererile din Programări.</p>
            </div>
          ) : view === "board" ? (
            <div className="grid auto-cols-[84%] grid-flow-col snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:auto-cols-[minmax(230px,1fr)] sm:snap-none">
              {LEAD_STAGES.filter((s) => isOpenStage(s.id)).map((s) => {
                const col = filtered.filter((l) => l.stage === s.id);
                return (
                  <section key={s.id} className="min-w-0 snap-start rounded-[18px] border border-border bg-neutral-bg p-2.5" aria-label={s.label}>
                    <h2 className="px-1.5 pb-2 pt-1 text-[14px] font-extrabold">{s.label}<div className="text-[12px] font-medium text-muted tabular-nums">{col.length} · {formatLei(col.reduce((a, l) => a + (Number(l.estimated_value) || 0), 0))} / lună</div></h2>
                    {col.length ? col.map(card) : <p className="px-1.5 py-2 text-[12.5px] text-muted">Niciun lead</p>}
                  </section>
                );
              })}
            </div>
          ) : (
            <>
            <ul className="flex flex-col md:hidden">
              {filtered.map((l) => <li key={l.id}>{card(l)}<div className="-mt-1 mb-2 px-1 text-[12px] text-muted">{stageLabel(l.stage)}</div></li>)}
            </ul>
            <div className="hidden overflow-x-auto rounded-[16px] border border-border bg-white md:block">
              <table className="w-full min-w-[760px] text-[13px]">
                <thead><tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted"><th className="p-3">Firmă</th><th className="p-3">Etapă</th><th className="p-3">Sursă</th><th className="p-3">Valoare / lună</th><th className="p-3">Reluare</th><th className="p-3">Ultimul contact</th></tr></thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr key={l.id} data-lead-item tabIndex={0} onClick={() => setSelected(l.id)} onKeyDown={(e) => e.key === "Enter" && setSelected(l.id)} aria-current={selected === l.id} className={`cursor-pointer border-b border-border last:border-0 hover:bg-neutral-bg ${selected === l.id ? "bg-neutral-bg" : ""}`}>
                      <td className="p-3"><div className="font-bold">{l.company_name}</div><div className="text-muted">{l.contact_name}</div></td>
                      <td className="p-3"><span className="rounded-full bg-neutral-bg px-2.5 py-0.5 text-[12px] font-semibold">{stageLabel(l.stage)}</span></td>
                      <td className="p-3">{sourceLabel(l.source)}</td>
                      <td className="p-3 font-bold tabular-nums">{l.estimated_value == null ? "—" : formatLei(Number(l.estimated_value))}</td>
                      <td className="p-3"><FollowTag lead={l} today={today} /></td>
                      <td className="p-3 text-muted">{byLead.get(l.id)?.[0] ? when(byLead.get(l.id)![0].created_at) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
          {leads.length > 0 && filtered.length === 0 && <p className="mt-3 text-[13px] text-muted">Niciun lead nu se potrivește filtrelor.</p>}
        </div>

        {selected === "new" && (
          <aside className="min-w-0 fixed inset-0 z-50 overflow-y-auto bg-white p-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] xl:static xl:z-auto xl:overflow-visible xl:rounded-[18px] xl:border xl:border-border xl:p-5 xl:sticky xl:top-4 xl:self-start" data-lead-panel aria-label="Lead nou">
            <h2 className="mb-3 text-[19px] font-extrabold">Lead nou</h2>
            <LeadForm onDone={() => setSelected(null)} />
          </aside>
        )}
        {current && <Panel key={current.id} lead={current} events={byLead.get(current.id) ?? []} today={today} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
}
