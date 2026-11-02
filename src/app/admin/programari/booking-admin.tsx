"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database, Json } from "@/lib/supabase/database.types";

type Settings = Database["public"]["Tables"]["booking_settings"]["Row"];
type Booking = Database["public"]["Tables"]["bookings"]["Row"];
type Day = Database["public"]["Tables"]["booking_days"]["Row"];
type Weekday = { on: boolean; from: string; to: string };
type Weekly = Partial<Record<"0" | "1" | "2" | "3" | "4" | "5" | "6", Weekday>> & { _texts?: Record<string, string> };
const WEEKDAYS = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];
const DEFAULT_TEXTS: Record<string, string> = {
  title: "Programează o discuție", sub: "Alege o zi din calendar, apoi ora. Zilele cu linie galbenă au ore libere.",
  slotsEmpty: "Ora", pickDay: "Alege o zi din calendar.", slotsTitle: "Ore libere: {data}",
  noSlots: "Nu mai sunt ore libere în această zi.", formTitle: "Datele tale pentru {data}, ora {ora}",
  book: "Confirmă programarea", ok: "Programat: {data}, ora {ora}. Te contactăm.",
};
const TEXT_LABELS: Record<string, string> = { title: "Titlul paginii", sub: "Descriere", slotsEmpty: "Titlu ore", pickDay: "Alege o zi", slotsTitle: "Ore disponibile", noSlots: "Fără ore disponibile", formTitle: "Titlu formular", book: "Buton confirmare", ok: "Mesaj confirmare" };
const input = "rounded-lg border border-border bg-white px-3 py-2 text-sm";
const button = "rounded-lg bg-purple px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
const card = "space-y-4 rounded-xl border border-border bg-white p-5";
const dayKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
const clock = (date: string) => new Date(date).toLocaleTimeString("ro-RO", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit" });
function datesBetween(from: string, to: string) {
  const days: string[] = [];
  for (const day = new Date(`${from}T12:00:00Z`); day <= new Date(`${to}T12:00:00Z`) && days.length < 366; day.setUTCDate(day.getUTCDate() + 1)) days.push(day.toISOString().slice(0, 10));
  return days;
}
function standardSlots(day: string, weekly: Weekly, minutes: number) {
  const value = weekly[String(new Date(`${day}T12:00:00Z`).getUTCDay()) as "0"];
  if (!Number.isFinite(minutes) || minutes < 10 || minutes > 240) return [];
  if (!value?.on) return [];
  const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  const result: string[] = [];
  for (let n = toMinutes(value.from); n + minutes <= toMinutes(value.to); n += minutes) result.push(`${Math.floor(n / 60).toString().padStart(2, "0")}:${(n % 60).toString().padStart(2, "0")}`);
  return result;
}

export function BookingAdmin({ settings, days, bookings }: { settings: Settings; days: Day[]; bookings: Booking[] }) {
  const router = useRouter();
  const [weekly, setWeekly] = useState(settings.weekly as unknown as Weekly);
  const [texts, setTexts] = useState({ ...DEFAULT_TEXTS, ...((settings.weekly as unknown as Weekly)._texts ?? {}) });
  const [slotMinutes, setSlotMinutes] = useState(settings.slot_minutes);
  const [daysAhead, setDaysAhead] = useState(settings.days_ahead);
  const today = dayKey(new Date());
  const [selectedDay, setSelectedDay] = useState(today);
  const [customSlots, setCustomSlots] = useState<string[] | null>(null);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const dayBookings = bookings.filter((b) => dayKey(new Date(b.slot_start)) === selectedDay);
  const stored = days.find((d) => d.day === selectedDay)?.slots as string[] | undefined;
  const selectedSlots = customSlots ?? stored ?? standardSlots(selectedDay, weekly, slotMinutes);
  const safeMinutes = Number.isInteger(slotMinutes) && slotMinutes >= 10 && slotMinutes <= 240 ? slotMinutes : 30;
  const allSlots = [...new Set([...Array.from({ length: Math.floor(24 * 60 / safeMinutes) }, (_, n) => `${Math.floor(n * safeMinutes / 60).toString().padStart(2, "0")}:${(n * safeMinutes % 60).toString().padStart(2, "0")}`), ...selectedSlots, ...dayBookings.map((b) => clock(b.slot_start))])].sort();

  function run(action: () => Promise<{ error: { message: string } | null }>, success: string) {
    setMessage("");
    startTransition(async () => {
      try { const result = await action(); if (result.error) setMessage(`Eroare: ${result.error.message}`); else { setMessage(success); router.refresh(); } }
      catch { setMessage("Eroare de conexiune. Modificările nu au fost confirmate."); }
    });
  }
  function saveSettings() {
    if (!Number.isInteger(slotMinutes) || slotMinutes < 10 || slotMinutes > 240 || !Number.isInteger(daysAhead) || daysAhead < 1 || daysAhead > 365) { setMessage("Durata trebuie să fie 10–240 minute, iar intervalul 1–365 zile."); return; }
    if ([0, 1, 2, 3, 4, 5, 6].some((key) => { const d = weekly[String(key) as "0"]; return d?.on && d.from >= d.to; })) { setMessage("Ora de început trebuie să fie înainte de ora de final."); return; }
    run(async () => await createClient().from("booking_settings").upsert({ id: 1, slot_minutes: slotMinutes, days_ahead: daysAhead, weekly: { ...weekly, _texts: texts } as unknown as Json }), "Programul și textele au fost salvate.");
  }
  function saveDays(keys: string[], getSlots: (key: string) => string[]) {
    if (!keys.length || keys.some((key) => key < today)) { setMessage("Alege o perioadă validă, începând de astăzi."); return; }
    const rows = keys.map((day) => ({ day, slots: [...new Set([...getSlots(day), ...bookings.filter((b) => dayKey(new Date(b.slot_start)) === day).map((b) => clock(b.slot_start))])].sort() }));
    run(async () => await createClient().from("booking_days").upsert(rows), "Disponibilitatea a fost actualizată. Programările existente au fost păstrate.");
  }
  return <div className="mx-auto max-w-5xl space-y-5 p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-extrabold">Administrare programări</h1><a href="/programare" target="_blank" rel="noreferrer" className="text-sm font-semibold text-purple">Vezi pagina publică ↗</a></div>
    <p className="text-sm text-muted">Programul este afișat în ora României. Doar super administratorii pot modifica disponibilitatea și programările.</p>
    {message && <p role="status" className="rounded-lg border border-border bg-neutral-bg p-3 text-sm">{message}</p>}
    <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
      <section className={card}><h2 className="text-lg font-bold">Disponibilitate pe zi</h2>
        <label className="flex flex-wrap items-center gap-3 text-sm">Ziua <input type="date" min={today} value={selectedDay} onChange={(e) => { setSelectedDay(e.target.value || today); setCustomSlots(null); }} className={input} /></label>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">{allSlots.map((time) => { const booking = dayBookings.find((b) => clock(b.slot_start) === time); const selected = selectedSlots.includes(time); return <button key={time} type="button" disabled={!!booking} title={booking ? `Rezervat: ${booking.name}` : undefined} aria-pressed={selected} onClick={() => setCustomSlots(selected ? selectedSlots.filter((t) => t !== time) : [...selectedSlots, time])} className={`rounded-lg border p-2 text-xs ${booking ? "border-border bg-amber-soft" : selected ? "border-purple bg-purple-soft text-purple" : "border-border"}`}>{time}{booking ? " · rezervat" : ""}</button>; })}</div>
        <div className="flex flex-wrap gap-2"><button className={button} onClick={() => saveDays([selectedDay], () => selectedSlots)}>Salvează ziua</button><button className={input} onClick={() => saveDays([selectedDay], () => [])}>Închide ziua</button><button className={input} onClick={() => run(async () => await createClient().from("booking_days").delete().eq("day", selectedDay), "Ziua folosește din nou programul standard.")}>Revino la programul standard</button>
        <button className={input} onClick={() => { const date = new Date(`${selectedDay}T12:00:00Z`); const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12)).toISOString().slice(0, 10); saveDays(datesBetween(selectedDay, end).filter((d) => new Date(`${d}T12:00:00Z`).getUTCDay() === date.getUTCDay()), () => selectedSlots); }}>Repetă în aceeași zi a săptămânii, până la sfârșitul lunii</button></div>
        {!!dayBookings.length && <p className="text-sm text-muted">Rezervări: {dayBookings.map((b) => `${clock(b.slot_start)} — ${b.name}`).join("; ")}</p>}
      </section>
      <section className={card}><h2 className="text-lg font-bold">Următoarele programări · {bookings.length}</h2>
        {!bookings.length && <p className="text-sm text-muted">Nu există programări viitoare.</p>}
        {bookings.map((b) => <div key={b.id} className="flex flex-wrap justify-between gap-3 border-t border-border pt-3 text-sm"><div><p className="font-bold">{new Date(b.slot_start).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", dateStyle: "medium", timeStyle: "short" })} · {b.name}</p><a href={`tel:${b.phone}`} className="text-purple">{b.phone}</a>{b.email && <p>{b.email}</p>}{b.note && <p className="text-muted">{b.note}</p>}</div><button className="h-fit rounded-lg border border-danger px-3 py-2 text-danger" onClick={() => { if (confirm(`Anulezi programarea lui ${b.name}?`)) run(async () => await createClient().from("bookings").delete().eq("id", b.id), "Programarea a fost anulată."); }}>Anulează programarea</button></div>)}
      </section>
      <section className={card}><h2 className="text-lg font-bold">Blochează o perioadă</h2><p className="text-sm text-muted">Programările confirmate se păstrează.</p><div className="flex flex-wrap gap-3"><label className="text-sm">De la <input aria-label="Prima zi" type="date" min={today} value={from} onChange={(e) => setFrom(e.target.value)} className={input} /></label><label className="text-sm">Până la <input aria-label="Ultima zi" type="date" min={from} value={to} onChange={(e) => setTo(e.target.value)} className={input} /></label></div><div className="flex flex-wrap gap-3"><button className={button} onClick={() => saveDays(datesBetween(from, to), () => [])}>Blochează perioada</button><button className={input} onClick={() => { if (!from || !to || to < from || datesBetween(from, to).length > 365) { setMessage("Alege o perioadă de maximum 365 de zile."); return; } run(async () => await createClient().from("booking_days").delete().gte("day", from).lte("day", to), "Perioada folosește programul standard."); }}>Revino la programul standard</button></div></section>
      <section className={card}><h2 className="text-lg font-bold">Program standard</h2>{[1, 2, 3, 4, 5, 6, 0].map((n) => { const day = weekly[String(n) as "0"] ?? { on: false, from: "09:00", to: "17:00" }; return <div key={n} className="flex flex-wrap items-center gap-3 text-sm"><label className="w-28"><input type="checkbox" checked={day.on} onChange={(e) => setWeekly({ ...weekly, [n]: { ...day, on: e.target.checked } })} /> {WEEKDAYS[n]}</label><input aria-label={`${WEEKDAYS[n]} început`} type="time" value={day.from} onChange={(e) => setWeekly({ ...weekly, [n]: { ...day, from: e.target.value } })} className={input} /><span>–</span><input aria-label={`${WEEKDAYS[n]} final`} type="time" value={day.to} onChange={(e) => setWeekly({ ...weekly, [n]: { ...day, to: e.target.value } })} className={input} /></div>; })}<div className="flex flex-wrap gap-4"><label className="text-sm">Durată (minute) <input type="number" min={10} max={240} value={slotMinutes} onChange={(e) => setSlotMinutes(Number(e.target.value))} className={`${input} w-24`} /></label><label className="text-sm">Zile în avans <input type="number" min={1} max={365} value={daysAhead} onChange={(e) => setDaysAhead(Number(e.target.value))} className={`${input} w-24`} /></label></div><button className={button} onClick={saveSettings}>Salvează programul și textele</button></section>
      <details className={card}><summary className="cursor-pointer text-lg font-bold">Textele paginii publice</summary><p className="text-sm text-muted">Poți păstra variabilele {"{data}"} și {"{ora}"} pentru afișarea datei și orei.</p>{Object.keys(DEFAULT_TEXTS).map((key) => <label key={key} className="block space-y-1 text-sm">{TEXT_LABELS[key]}<textarea rows={2} value={texts[key]} onChange={(e) => setTexts({ ...texts, [key]: e.target.value })} className={`${input} block w-full`} /></label>)}<button className={button} onClick={saveSettings}>Salvează programul și textele</button></details>
    </fieldset>
  </div>;
}
