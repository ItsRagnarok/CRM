"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { calHref, VIEW_HINTS, type CalQuery, type CalView } from "./cal-query";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Layers, ListOrdered, Plus, Users } from "lucide-react";

const VIEWS: { id: CalView; label: string; icon: typeof Users }[] = [
  { id: "echipe", label: "Echipe", icon: Users },
  { id: "week", label: "Săptămână", icon: CalendarDays },
  { id: "day", label: "Zi", icon: ListOrdered },
];

export function CalendarToolbar({
  q,
  rangeLabel,
  prevDate,
  nextDate,
  todayStr,
  showsToday,
  teams,
  domains,
}: {
  q: CalQuery;
  rangeLabel: string;
  prevDate: string;
  nextDate: string;
  todayStr: string;
  /** Perioada afișată conține deja ziua de azi: butonul „Azi” n-ar avea ce face. */
  showsToday: boolean;
  teams: { id: string; name: string }[];
  domains: { id: string; label: string }[];
}) {
  const router = useRouter();
  const dateInput = useRef<HTMLInputElement>(null);
  const navBtn = "flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] border border-border bg-white text-[#344054] shadow-[0_1px_2px_rgba(16,24,40,.05)] hover:bg-[#f9fafb]";
  const select = "h-10 appearance-none rounded-[11px] border border-border bg-white pl-9 pr-8 text-[13px] font-semibold text-[#344054] shadow-[0_1px_2px_rgba(16,24,40,.05)] outline-none focus:border-electric";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Link href={calHref(q, { date: prevDate })} className={navBtn} aria-label="Perioada anterioară">
        <ChevronLeft className="h-4 w-4" />
      </Link>
      <button
        type="button"
        onClick={() => {
          const el = dateInput.current;
          if (!el) return;
          try { el.showPicker(); } catch { el.focus(); }
        }}
        className="relative flex h-10 items-center gap-2 rounded-[11px] border border-border bg-white px-3.5 text-[13.5px] font-bold text-foreground shadow-[0_1px_2px_rgba(16,24,40,.05)] hover:bg-[#f9fafb]"
        aria-label="Alege data"
      >
        <CalendarDays className="h-4 w-4 text-[#475467]" />
        {rangeLabel}
        <ChevronDown className="h-4 w-4 text-[#475467]" />
        <input
          ref={dateInput}
          type="date"
          value={q.date}
          onChange={(e) => e.target.value && router.push(calHref(q, { date: e.target.value }))}
          className="pointer-events-none absolute bottom-0 left-0 h-0 w-0 opacity-0"
          tabIndex={-1}
          aria-hidden="true"
        />
      </button>
      <Link href={calHref(q, { date: nextDate })} className={navBtn} aria-label="Perioada următoare">
        <ChevronRight className="h-4 w-4" />
      </Link>
      {showsToday ? (
        <span
          className="flex h-10 items-center rounded-[11px] border border-dashed border-border px-3.5 text-[13px] font-semibold text-muted-2"
          title="Ești deja pe perioada care conține ziua de azi (coloana evidențiată)."
        >
          Azi
        </span>
      ) : (
        <Link href={calHref(q, { date: todayStr })} className="flex h-10 items-center rounded-[11px] border border-border bg-white px-3.5 text-[13px] font-bold text-foreground shadow-[0_1px_2px_rgba(16,24,40,.05)] hover:bg-[#f9fafb]">
          Azi
        </Link>
      )}

      <div className="flex h-10 items-center gap-0.5 rounded-full border border-border bg-white p-1 shadow-[0_1px_2px_rgba(16,24,40,.05)]" role="tablist" aria-label="Mod de afișare">
        {VIEWS.map(({ id, label, icon: Icon }) => {
          const on = q.view === id;
          return (
            <Link
              key={id}
              href={calHref(q, { view: id })}
              role="tab"
              aria-selected={on}
              title={VIEW_HINTS[id]}
              className={`flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold ${on ? "bg-[#101828] text-white" : "text-[#344054] hover:bg-[#f2f4f7]"}`}
            >
              <Icon className={`h-4 w-4 ${on ? "text-[#c6ff4a]" : ""}`} /> {label}
            </Link>
          );
        })}
      </div>

      <div className="relative">
        <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#475467]" />
        <select value={q.teamId} onChange={(e) => router.push(calHref(q, { teamId: e.target.value }))} className={select} aria-label="Echipa">
          <option value="">Toate echipele</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#475467]" />
      </div>
      {domains.length > 1 && (
        <div className="relative">
          <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#475467]" />
          <select value={q.domain} onChange={(e) => router.push(calHref(q, { domain: e.target.value }))} className={select} aria-label="Domeniul">
            <option value="">Toate domeniile</option>
            {domains.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#475467]" />
        </div>
      )}

      <Link
        href={`/lucrari/nou?date=${q.date}`}
        className="ml-auto flex h-10 items-center gap-2 rounded-[11px] bg-electric px-4 text-[13.5px] font-extrabold shadow-[0_6px_16px_rgba(132,204,22,.28)] hover:brightness-95"
      >
        <Plus className="h-4 w-4" strokeWidth={2.6} /> Programează lucrare
      </Link>
    </div>
  );
}
