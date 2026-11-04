"use client";

import { useState, type ReactNode } from "react";

type View = "day" | "week" | "month";
const views: { key: View; label: string }[] = [
  { key: "day", label: "Zi" },
  { key: "week", label: "Săptămână" },
  { key: "month", label: "Lună" },
];
const control = "rounded-lg border border-border bg-white px-3 py-2 text-sm disabled:opacity-40";
const asDate = (day: string) => new Date(`${day}T12:00:00Z`);
const key = (date: Date) => date.toISOString().slice(0, 10);
const dateLabel = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short", timeZone: "UTC" });
const weekdayLabel = new Intl.DateTimeFormat("ro-RO", { weekday: "long", timeZone: "UTC" });
const monthLabel = new Intl.DateTimeFormat("ro-RO", { month: "long", year: "numeric", timeZone: "UTC" });

function shiftDay(day: string, offset: number) {
  const date = asDate(day);
  date.setUTCDate(date.getUTCDate() + offset);
  return key(date);
}

function monday(day: string) {
  return shiftDay(day, -((asDate(day).getUTCDay() + 6) % 7));
}

function shiftMonth(day: string, offset: number) {
  const date = asDate(`${day.slice(0, 7)}-01`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return key(date);
}

function weekLabel(start: string) {
  const thursday = shiftDay(start, 3);
  const firstMonday = monday(`${thursday.slice(0, 4)}-01-04`);
  const number = 1 + Math.round((Date.parse(start) - Date.parse(firstMonday)) / 604_800_000);
  return `Săptămâna ${number} · ${dateLabel.format(asDate(start))} – ${dateLabel.format(asDate(shiftDay(start, 6)))}`;
}

export function BookingCalendar({ today, selectedDay, onSelectDay, getSummary, children }: {
  today: string;
  selectedDay: string;
  onSelectDay: (day: string) => void;
  getSummary: (day: string) => { slots: number; bookings: number };
  children: ReactNode;
}) {
  const [view, setView] = useState<View>("day");
  const [cursor, setCursor] = useState(selectedDay);
  const start = monday(cursor);
  const first = shiftMonth(cursor, 0);
  const end = shiftMonth(cursor, 1);
  const weeks: string[] = [];
  for (let week = monday(first); week < end; week = shiftDay(week, 7)) weeks.push(week);
  const previous = view === "week" ? shiftDay(start, -7) : shiftMonth(cursor, -1);
  const next = view === "week" ? shiftDay(start, 7) : end;
  const canGoBack = view === "week" ? shiftDay(previous, 6) >= today : previous.slice(0, 7) >= today.slice(0, 7);

  return (
    <section className="space-y-4 rounded-xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Disponibilitate</h2>
        <div role="group" aria-label="Vizualizare calendar" className="flex flex-wrap gap-1">
          {views.map(({ key: mode, label }) => (
            <button key={mode} type="button" aria-pressed={view === mode} className={`${control} ${view === mode ? "border-purple bg-purple-soft font-semibold text-purple" : ""}`} onClick={() => {
              if (view === "day") setCursor(selectedDay);
              setView(mode);
            }}>{label}</button>
          ))}
        </div>
      </div>
      {view === "day" ? children : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={control} disabled={!canGoBack} onClick={() => setCursor(previous)}>
              {view === "week" ? "Săptămâna anterioară" : "Luna anterioară"}
            </button>
            <input
              className={control}
              type={view === "week" ? "date" : "month"}
              aria-label={view === "week" ? "Alege o dată din săptămână" : "Alege luna"}
              min={view === "week" ? today : today.slice(0, 7)}
              value={view === "week" ? (cursor < today ? today : cursor) : first.slice(0, 7)}
              onChange={(event) => {
                const value = event.target.value;
                const pattern = view === "week" ? /^\d{4}-\d{2}-\d{2}$/ : /^\d{4}-(0[1-9]|1[0-2])$/;
                if (pattern.test(value) && event.target.validity.valid) setCursor(view === "week" ? value : `${value}-01`);
              }}
            />
            <button type="button" className={control} onClick={() => setCursor(next)}>
              {view === "week" ? "Săptămâna următoare" : "Luna următoare"}
            </button>
          </div>
          {view === "month" ? (
            <>
              <h3 className="font-semibold capitalize">{monthLabel.format(asDate(first))}</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {weeks.map((week) => (
                  <button type="button" key={week} disabled={shiftDay(week, 6) < today} className={`${control} text-left hover:border-purple`} onClick={() => { setCursor(week); setView("week"); }}>
                    {weekLabel(week)}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3 className="font-semibold">{weekLabel(start)}</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {Array.from({ length: 7 }, (_, offset) => shiftDay(start, offset)).map((day) => {
                  const { slots, bookings } = getSummary(day);
                  return (
                    <button key={day} type="button" disabled={day < today} className={`${control} text-left hover:border-purple ${day === selectedDay ? "border-purple bg-purple-soft" : ""}`} onClick={() => {
                      onSelectDay(day);
                      setCursor(day);
                      setView("day");
                    }}>
                      <span className="block font-semibold capitalize">{weekdayLabel.format(asDate(day))}</span>
                      <span className="block text-muted">{dateLabel.format(asDate(day))}</span>
                      {day >= today && <span className="mt-1 block text-xs text-muted">{slots ? `${slots} intervale setate` : "Închis"}{bookings > 0 && ` · ${bookings} rezervate`}</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
